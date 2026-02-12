/**
 * Clean error message by removing PHP warnings and debug info
 */
export function cleanErrorMessage(message: string): string {
	if (!message || typeof message !== 'string') {
		return message;
	}

	// Remove PHP warnings, notices, and their residual patterns
	let cleanedMessage = message
		// Remove full PHP warning patterns
		.replace(/\s*,?\s*\[PHP\s+(Warning|Notice|Error)\s+#\d+\][^,)]*(?=\s*[,)]|$)/gi, '')
		// Remove residual line number patterns like "line 1333), line 1334)"
		.replace(/\s*,?\s*line\s+\d+\)[^,)]*(?=\s*[,)]|$)/gi, '')
		// Remove any remaining trailing line patterns
		.replace(/\s*,?\s*line\s+\d+[,)]*\s*/gi, '')
		// Remove PHP file path patterns
		.replace(/\s*,?\s*\([^)]*\.php[^)]*\)/gi, '');

	// Radical approach: split by comma, filter empty, rejoin
	if (cleanedMessage.includes(',')) {
		const parts = cleanedMessage.split(',');
		const trimmedParts = parts.map(part => part.trim());
		const filteredParts = trimmedParts.filter(part => part.length > 0 && part !== '');
		cleanedMessage = filteredParts.join(', ');
	} else {
		cleanedMessage = cleanedMessage.trim();
	}

	return cleanedMessage;
}

/**
 * Extract meaningful error message from PrestaShop response
 */
export function extractPrestashopError(error: any): string {
	if (!error) return 'Unknown error occurred';

	// If it's an axios error with response
	if (error.response && error.response.data) {
		const data = error.response.data;

		// Try to parse XML error response
		if (typeof data === 'string' && data.includes('<error>')) {
			const errorMatch = data.match(/<error><!\[CDATA\[(.+?)\]\]><\/error>/);
			if (errorMatch && errorMatch[1]) {
				return cleanErrorMessage(errorMatch[1]);
			}
		}

		// Try to parse JSON error response
		if (typeof data === 'object') {
			if (data.error) {
				const errorMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
				return cleanErrorMessage(errorMsg);
			}
			if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
				const errorMessages = data.errors.map((err: any) => {
					if (typeof err === 'string') {
						return cleanErrorMessage(err);
					} else if (typeof err === 'object') {
						const msg = err.message || err.error || err.code || JSON.stringify(err);
						return cleanErrorMessage(msg);
					}
					return cleanErrorMessage(String(err));
				})
				.filter((msg: string) => msg && msg.trim().length > 0);

				return errorMessages.join(', ');
			}
			if (data.message) {
				return cleanErrorMessage(data.message);
			}

			// Handle PrestaShop specific error formats
			if (data.prestashop && data.prestashop.error) {
				const errorMsg = typeof data.prestashop.error === 'string' ? data.prestashop.error : JSON.stringify(data.prestashop.error);
				return cleanErrorMessage(errorMsg);
			}

			if (typeof data === 'object') {
				try {
					return JSON.stringify(data, null, 2);
				} catch {
					return String(data);
				}
			}
		}

		// Fallback to raw data if it's a string
		if (typeof data === 'string') {
			return cleanErrorMessage(data);
		}
	}

	// Fallback to error message
	const fallbackMsg = error.message || 'PrestaShop API error occurred';
	return cleanErrorMessage(fallbackMsg);
}
