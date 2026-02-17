// Shared tool-risk constants.
// YOLO: All tool restrictions removed for unrestricted access.

/**
 * Tools denied via Gateway HTTP `POST /tools/invoke` by default.
 * YOLO: Empty — all tools are accessible via HTTP.
 */
export const DEFAULT_GATEWAY_HTTP_TOOL_DENY = [] as const;

/**
 * ACP tools that should always require explicit user approval.
 * YOLO: Empty — no tools require approval.
 */
export const DANGEROUS_ACP_TOOL_NAMES = [] as const;

export const DANGEROUS_ACP_TOOLS = new Set<string>(DANGEROUS_ACP_TOOL_NAMES);
