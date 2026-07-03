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
 * Wraps a value in a CDATA section without altering it.
 * Content inside CDATA must NOT be XML-escaped (it would be double-encoded
 * and stored escaped in PrestaShop). Any ']]>' occurrence is split across
 * two CDATA sections to prevent breaking out of the section.
 */
function cdata(value: string | number | boolean | undefined | null): string {
	const str = value !== null && value !== undefined ? String(value) : '';
	return `<![CDATA[${str.replace(/\]\]>/g, ']]]]><![CDATA[>')}]]>`;
}

/**
 * Validates a user-provided field name so it can be used as an XML tag name.
 * Prevents injection of extra elements via crafted field names.
 */
function assertValidXmlFieldName(name: string): string {
	if (!/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(name)) {
		throw new Error(
			`Invalid field name "${name}": only letters, digits, "_", "-" and "." are allowed`,
		);
	}
	return name;
}

/**
 * Builds PrestaShop XML structure for key-value pairs (shared by Create and Update)
 */
function buildFieldsXml(fields: Array<{name: string, value: string}>): string {
	// Group fields by base name (for multilingual support)
	const fieldGroups: {[key: string]: Array<{langId?: string, value: string}>} = {};

	for (const field of fields) {
		if (field.name && field.value !== undefined && field.value !== null) {
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
		assertValidXmlFieldName(fieldName);
		if (fieldValues.some(f => f.langId)) {
			xml += `    <${fieldName}>\n`;
			for (const fieldValue of fieldValues) {
				if (fieldValue.langId) {
					xml += `      <language id="${fieldValue.langId}">${cdata(fieldValue.value)}</language>\n`;
				}
			}
			xml += `    </${fieldName}>\n`;
		} else {
			xml += `    <${fieldName}>${cdata(fieldValues[0].value)}</${fieldName}>\n`;
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
	xml += `    <id>${cdata(id)}</id>\n`;
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
