# Plan: Improving Promptfoo Export/Import Commands

## Overview

This plan outlines improvements to the promptfoo export and import commands while maintaining full backwards compatibility with existing exported files.

**Critical Discovery**: Version 4 (normalized database structure) was introduced on October 7, 2024. The import command currently cannot handle ANY exports from evals created after this date, making this a critical production issue.

## Guiding Principles

1. **Backwards Compatibility**: All existing export files must continue to work
2. **Data Integrity**: No data loss during export/import cycles
3. **Safety First**: Prevent accidental data corruption or overwrites
4. **Comprehensive Testing**: Every code path must be tested
5. **Progressive Enhancement**: Add new features without breaking old ones

## Phase 1: Strengthen Foundation (Priority: Critical)

### 1.1 Add Comprehensive Test Coverage for Import Command

**Tasks:**
- Create `test/commands/import.test.ts` with full coverage
- Test all version paths (v2, v3, and future v4)
- Test error scenarios (invalid JSON, missing files, corrupt data)
- Test edge cases (empty evals, large datasets, special characters)

**Implementation:**
```typescript
// Test structure to cover:
- Import v2 eval successfully
- Import v3 eval successfully  
- Import with missing required fields
- Import with invalid JSON
- Import with non-existent file
- Import with ID collision
- Import with corrupt data structure
- Import preserves all relationships
```

### 1.2 Add Schema Validation

**Tasks:**
- Define Zod schemas for each eval version
- Validate imported data before database operations
- Provide clear error messages for validation failures

**Implementation:**
```typescript
// Add to src/types/schemas/import.ts
const EvalV2Schema = z.object({
  id: z.string().optional(),
  createdAt: z.union([z.string(), z.date()]),
  author: z.string().optional(),
  results: z.object({
    version: z.literal(2),
    // ... rest of v2 structure
  }),
  config: z.record(z.unknown())
});

const EvalV3Schema = z.object({
  // ... v3 structure
});

const ImportSchema = z.union([EvalV2Schema, EvalV3Schema]);
```

### 1.3 Improve Error Handling

**Tasks:**
- Distinguish between different error types
- Add specific error messages for common failures
- Implement proper cleanup on failure

**Implementation:**
```typescript
try {
  // Check file exists
  if (!fs.existsSync(file)) {
    throw new Error(`File not found: ${file}`);
  }
  
  // Read file
  const fileContent = fs.readFileSync(file, 'utf-8');
  
  // Parse JSON with better error
  let evalData;
  try {
    evalData = JSON.parse(fileContent);
  } catch (e) {
    throw new Error(`Invalid JSON in file ${file}: ${e.message}`);
  }
  
  // Validate schema
  const validated = ImportSchema.parse(evalData);
  
} catch (error) {
  if (error instanceof z.ZodError) {
    logger.error(`Invalid eval format: ${error.flatten()}`);
  } else {
    logger.error(`Import failed: ${error.message}`);
  }
  process.exit(1);
}
```

## Phase 2: Fix Critical Bugs (Priority: High)

### 2.1 Handle ID Collisions

**Tasks:**
- Check if eval ID already exists before import
- Add `--force` flag to override existing evals
- Add `--new-id` flag to generate new ID on import

**Implementation:**
```typescript
// Add to import command
.option('-f, --force', 'Override existing eval with same ID')
.option('-n, --new-id', 'Generate new ID instead of using exported ID')

// In action handler
if (!cmdObj.newId && evalData.id) {
  const existing = await Eval.findById(evalData.id);
  if (existing && !cmdObj.force) {
    logger.error(`Eval with ID ${evalData.id} already exists. Use --force to override or --new-id to create new.`);
    process.exit(1);
  }
}

const evalId = cmdObj.newId ? createEvalId() : evalData.id || createEvalId();
```

### 2.2 Add Transaction Support for All Imports

**Tasks:**
- Wrap all database operations in transactions
- Ensure rollback on any failure
- Add progress indicators for large imports

**Implementation:**
```typescript
const db = getDb();
await db.transaction(async (tx) => {
  try {
    // All import operations here
    if (version === 2) {
      await importV2(tx, evalData, evalId);
    } else if (version === 3) {
      await importV3(tx, evalData, evalId);
    }
  } catch (error) {
    logger.error('Import failed, rolling back changes');
    throw error;
  }
});
```

### 2.3 Preserve All Relationships

**Tasks:**
- Export and import tags
- Export and import dataset relationships  
- Export and import prompt relationships
- Maintain referential integrity

**Implementation:**
```typescript
// Enhance export to include relationships
const exportData = {
  evalId: evalRecord.id,
  results: summary,
  config: evalRecord.config,
  shareableUrl,
  metadata,
  // New fields (backwards compatible - old imports will ignore)
  relationships: {
    tags: await evalRecord.getTags(),
    datasets: await evalRecord.getDatasets(),
    prompts: await evalRecord.getPrompts()
  }
};

// Import preserves relationships if present
if (evalData.relationships) {
  await importRelationships(evalId, evalData.relationships);
}
```

## Phase 3: Add Version 4 Support (Priority: CRITICAL)

**Context:** Version 4 was introduced on October 7, 2024 (PR #1776). All evals created after this date use the normalized structure, making this a critical compatibility issue.

### 3.1 Implement V4 Export/Import

**Tasks:**
- Handle normalized eval structure (results in separate table)
- Export all eval results efficiently (already works, exports as v3 format)
- Import v3 format into v4 structure (MISSING - this is the critical gap)
- Import with proper batching for large datasets

**Implementation:**
```typescript
// Note: V4 evals already export as v3 format (see toEvaluateSummary in eval.ts)
// The critical fix is handling v3 imports into the v4 structure

// For v3 import into v4 structure (CRITICAL FIX)
if (evalData.results.version === 3) {
  logger.debug('Importing v3 eval into v4 structure');
  
  // Create the eval record with normalized structure
  const evalRecord = await Eval.create(
    evalData.config,
    evalData.results.prompts || [], // v3 includes prompts
    {
      id: evalId,
      createdAt: new Date(evalData.createdAt || evalData.results.timestamp),
      author: evalData.author || getUserEmail() || 'Unknown',
    }
  );
  
  // Import results in batches to handle large datasets
  const batchSize = 1000;
  const results = evalData.results.results;
  
  for (let i = 0; i < results.length; i += batchSize) {
    const batch = results.slice(i, i + batchSize);
    await EvalResult.createManyFromEvaluateResult(batch, evalId);
    
    if (i % 10000 === 0) {
      logger.info(`Imported ${i}/${results.length} results...`);
    }
  }
  
  logger.info(`Successfully imported v3 eval with ${results.length} results`);
}
```

## Phase 4: Enhanced Features (Priority: Medium)

### 4.1 Add Import Preview/Dry Run

**Tasks:**
- Add `--dry-run` flag to preview import without changes
- Show what would be imported
- Detect and warn about potential issues

**Implementation:**
```typescript
.option('-d, --dry-run', 'Preview import without making changes')

if (cmdObj.dryRun) {
  logger.info('DRY RUN - No changes will be made');
  logger.info(`Would import eval: ${evalId}`);
  logger.info(`Version: ${evalData.results.version}`);
  logger.info(`Created: ${evalData.createdAt}`);
  logger.info(`Test cases: ${evalData.results.results.length}`);
  
  if (existing) {
    logger.warn(`Would override existing eval: ${existing.id}`);
  }
  
  process.exit(0);
}
```

### 4.2 Add Metadata Validation

**Tasks:**
- Warn if importing from different promptfoo version
- Check platform compatibility
- Store import metadata for audit trail

**Implementation:**
```typescript
if (evalData.metadata) {
  const currentVersion = VERSION;
  const exportVersion = evalData.metadata.promptfooVersion;
  
  if (exportVersion && !isCompatibleVersion(currentVersion, exportVersion)) {
    logger.warn(`Importing from different version: ${exportVersion} -> ${currentVersion}`);
  }
}

// Store import metadata
const importMetadata = {
  importedAt: new Date().toISOString(),
  importedBy: getUserEmail(),
  sourceVersion: evalData.metadata?.promptfooVersion,
  importVersion: VERSION
};
```

### 4.3 Enhance Export Format

**Tasks:**
- Add compression option for large exports
- Support streaming for huge datasets
- Add checksum for integrity verification

**Implementation:**
```typescript
.option('-c, --compress', 'Compress output file (gzip)')
.option('--checksum', 'Include SHA256 checksum for verification')

if (cmdObj.compress) {
  const gzip = zlib.createGzip();
  const output = fs.createWriteStream(`${outputPath}.gz`);
  gzip.pipe(output);
  gzip.write(JSON.stringify(exportData));
  gzip.end();
}

if (cmdObj.checksum) {
  exportData.checksum = sha256(JSON.stringify(exportData));
}
```

## Phase 5: Safety and Recovery (Priority: Medium)

### 5.1 Add Backup Before Import

**Tasks:**
- Optionally backup existing eval before override
- Add recovery mechanism
- Log all import operations

**Implementation:**
```typescript
.option('-b, --backup', 'Backup existing eval before override')

if (existing && cmdObj.backup) {
  const backupPath = `${evalId}-backup-${Date.now()}.json`;
  await exportEval(existing, backupPath);
  logger.info(`Backed up existing eval to: ${backupPath}`);
}
```

### 5.2 Add Import History

**Tasks:**
- Track all imports in database
- Allow viewing import history
- Support rollback to previous state

## Phase 6: Performance Optimization (Priority: Low)

### 6.1 Optimize Large Dataset Handling

**Tasks:**
- Stream processing for huge files
- Progress bars for long operations
- Memory-efficient processing

### 6.2 Parallel Processing

**Tasks:**
- Import results in parallel batches
- Optimize database operations
- Add performance metrics

## Testing Strategy

### Unit Tests
- Schema validation
- Version detection
- Error handling
- Data transformation

### Integration Tests  
- Full export/import cycles
- Database operations
- Transaction rollbacks
- Large dataset handling

### E2E Tests
- CLI command execution
- File system operations
- Real database interactions
- Cross-version compatibility

## Rollout Plan

1. **Week 1**: Phase 1 - Foundation and testing
2. **Week 2**: Phase 2 - Critical bug fixes
3. **Week 3**: Phase 3 - Version 4 support
4. **Week 4**: Phase 4 - Enhanced features
5. **Week 5**: Phase 5 - Safety features
6. **Week 6**: Phase 6 - Performance optimization

## Success Metrics

- Zero data loss in export/import cycles
- 100% test coverage for import command
- All existing export files continue to work
- Import failures provide actionable error messages
- Performance: Import 10k results in < 10 seconds

## Backwards Compatibility Checklist

- [x] Existing export files remain valid
- [x] New fields are optional/ignored by old code
- [x] Version detection handles all cases
- [x] No breaking changes to CLI interface
- [x] Graceful degradation for missing features