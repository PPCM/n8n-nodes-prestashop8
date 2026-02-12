// Barrel re-exports for backward compatibility
// import { ... } from './utils' resolves to './utils/index.ts'

export { extractPrestashopError, cleanErrorMessage } from './errors';
export {
	processResponseForMode,
	simplifyPrestashopResponse,
	processDisplayParameter,
	processSortParameter,
	buildPrestashopXml,
} from './response';
export { buildCreateXml, buildUpdateXml, parseXmlToJson, SINGULAR_RESOURCE_MAP } from './xml';
export {
	buildUrlWithFilters,
	validateFieldsForCreate,
	validateDataForResource,
	REQUIRED_FIELDS_BY_RESOURCE,
} from './filters';
