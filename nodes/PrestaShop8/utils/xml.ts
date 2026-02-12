import * as xml2js from 'xml2js';

/**
 * Map of plural resource names to their singular form for XML tags
 */
export const SINGULAR_RESOURCE_MAP: {[key: string]: string} = {
	'categories': 'category',
	'addresses': 'address',
	'countries': 'country',
	'states': 'state',
	'currencies': 'currency',
	'languages': 'language',
	'taxes': 'tax',
	'tax_rules': 'tax_rule',
	'zones': 'zone',
};

/**
 * Get singular form of a resource name for XML tags
 */
function getSingularResource(resource: string): string {
	return SINGULAR_RESOURCE_MAP[resource] || (resource.endsWith('s') ? resource.slice(0, -1) : resource);
}

/**
 * Escapes XML special characters
 */
function escapeXml(unsafe: string | number | boolean | undefined | null): string {
	const str = unsafe !== null && unsafe !== undefined ? String(unsafe) : '';

	return str.replace(/[<>&'"]/g, function (c) {
		switch (c) {
			case '<': return '&lt;';
			case '>': return '&gt;';
			case '&': return '&amp;';
			case "'": return '&apos;';
			case '"': return '&quot;';
			default: return c;
		}
	});
}

/**
 * Builds PrestaShop XML structure for key-value pairs (shared by Create and Update)
 */
function buildFieldsXml(fields: Array<{name: string, value: string}>): string {
	// Group fields by base name (for multilingual support)
	const fieldGroups: {[key: string]: Array<{langId?: string, value: string}>} = {};

	for (const field of fields) {
		if (field.name && field.value !== undefined) {
			const multilingualMatch = field.name.match(/^(.+)-(\d+)$/);

			if (multilingualMatch) {
				const [, fieldName, langId] = multilingualMatch;
				if (!fieldGroups[fieldName]) {
					fieldGroups[fieldName] = [];
				}
				fieldGroups[fieldName].push({ langId, value: field.value.toString() });
			} else {
				if (!fieldGroups[field.name]) {
					fieldGroups[field.name] = [];
				}
				fieldGroups[field.name].push({ value: field.value.toString() });
			}
		}
	}

	let xml = '';

	for (const [fieldName, fieldValues] of Object.entries(fieldGroups)) {
		if (fieldValues.some(f => f.langId)) {
			xml += `    <${fieldName}>\n`;
			for (const fieldValue of fieldValues) {
				if (fieldValue.langId) {
					xml += `      <language id="${fieldValue.langId}"><![CDATA[${escapeXml(fieldValue.value)}]]></language>\n`;
				}
			}
			xml += `    </${fieldName}>\n`;
		} else {
			xml += `    <${fieldName}><![CDATA[${escapeXml(fieldValues[0].value)}]]></${fieldName}>\n`;
		}
	}

	return xml;
}

/**
 * Builds PrestaShop XML for Create operations using key-value pairs
 */
export function buildCreateXml(resource: string, fields: Array<{name: string, value: string}>): string {
	const singularResource = getSingularResource(resource);

	let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
	xml += '<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">\n';
	xml += `  <${singularResource}>\n`;
	xml += buildFieldsXml(fields);
	xml += `  </${singularResource}>\n`;
	xml += '</prestashop>';

	return xml;
}

/**
 * Builds PrestaShop XML for Update operations using key-value pairs
 */
export function buildUpdateXml(resource: string, id: string | number, fields: Array<{name: string, value: string}>): string {
	const singularResource = getSingularResource(resource);

	let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
	xml += '<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">\n';
	xml += `  <${singularResource}>\n`;
	xml += buildFieldsXml(fields);
	xml += `    <id><![CDATA[${escapeXml(id)}]]></id>\n`;
	xml += `  </${singularResource}>\n`;
	xml += '</prestashop>';

	return xml;
}

/**
 * Parse XML to JSON
 */
export async function parseXmlToJson(xml: string): Promise<any> {
	const parser = new xml2js.Parser({
		explicitArray: false,
		mergeAttrs: true,
	});

	return parser.parseStringPromise(xml);
}
