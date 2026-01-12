/**
 * @fileoverview Integration Layer Index
 * 
 * Reasoning:
 * - Unified exports for all integration components
 * - Main entry point for Phase 3 features
 */

export { provisionDatabase, provisionDatabase as default, dropTable, tableExists, getTableInfo } from "./provisioner";

export { 
  saveVibeConfig, 
  getActiveConfigByUser, 
  getConfigById, 
  getConfigsByUser, 
  deactivateConfigsByUser,
  deleteConfig,
  getActiveResources,
  extractResourcesFromConfig,
  type VibeConfigRecord,
} from "./vibe-config";

export { 
  registerResourcesFromPlan, 
  registerResource, 
  unregisterResource, 
  getRegisteredResourceNames,
  isResourceRegistered,
  getRegistrationStats,
  syncResourcesFromPlan,
  resetRegistrations,
  exportRegistry,
  importRegistry,
} from "./auto-registrar";
