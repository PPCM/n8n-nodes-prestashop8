import { PrestaShop8Api } from '../../credentials/PrestaShop8Api.credentials';

describe('PrestaShop8Api Credentials', () => {
	let credentials: PrestaShop8Api;

	beforeEach(() => {
		credentials = new PrestaShop8Api();
	});

	it('should have correct name and displayName', () => {
		expect(credentials.name).toBe('prestaShop8Api');
		expect(credentials.displayName).toBe('PrestaShop 8 API');
	});

	describe('Properties', () => {
		it('should define exactly 2 properties', () => {
			expect(credentials.properties.length).toBe(2);
		});

		it('should have baseUrl as required string', () => {
			const baseUrl = credentials.properties.find((p) => p.name === 'baseUrl');
			expect(baseUrl).toBeDefined();
			expect(baseUrl!.type).toBe('string');
			expect(baseUrl!.required).toBe(true);
		});

		it('should have apiKey as required password string', () => {
			const apiKey = credentials.properties.find((p) => p.name === 'apiKey');
			expect(apiKey).toBeDefined();
			expect(apiKey!.type).toBe('string');
			expect((apiKey as any).typeOptions.password).toBe(true);
			expect(apiKey!.required).toBe(true);
		});

		it('should not define the removed no-op testConnection toggle', () => {
			const testConn = credentials.properties.find((p) => p.name === 'testConnection');
			expect(testConn).toBeUndefined();
		});
	});

	describe('Authentication', () => {
		it('should use generic authentication type', () => {
			expect(credentials.authenticate.type).toBe('generic');
		});

		it('should configure basic auth with apiKey as username and empty password', () => {
			const auth = (credentials.authenticate as any).properties.auth;
			expect(auth).toBeDefined();
			expect(auth.username).toBe('={{$credentials.apiKey}}');
			expect(auth.password).toBe('');
		});
	});

	describe('Test Request', () => {
		it('should define a test request', () => {
			expect(credentials.test).toBeDefined();
			expect(credentials.test.request).toBeDefined();
		});

		it('should use GET method on products endpoint', () => {
			const request = credentials.test.request;
			expect(request.method).toBe('GET');
			expect(request.url).toContain('/products');
			expect(request.url).toContain('display=[id]');
			expect(request.url).toContain('limit=1');
		});

		it('should normalize the base URL to end with /api like the node does', () => {
			// The expression appends /api and collapses a doubled suffix so a
			// base URL entered with or without /api gives the same test URL
			expect(credentials.test.request.url).toContain('+ "/api"');
			expect(credentials.test.request.url).toContain('/api/api$');
		});
	});
});
