import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

interface ScanIssue {
  id: string;
  type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  location?: string;
  mitigation?: string;
  details?: string;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface FileResult {
  filename: string;
  fileType: string;
  fileSize: number;
  issues: ScanIssue[];
}

interface ScanResult {
  summary: {
    totalFiles: number;
    totalVulnerabilities: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
    scanDuration: number;
    scanDate: string;
  };
  files: FileResult[];
}

// Check if file looks like a machine learning model
function isModelFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  const modelExtensions = [
    '.pt', '.pth', '.safetensors', '.bin', '.onnx', '.h5', '.keras', 
    '.tflite', '.pb', '.mlmodel', '.model', '.weights'
  ];
  
  return modelExtensions.includes(ext);
}

// Basic check for potential issues in model files
async function scanFile(filePath: string): Promise<FileResult> {
  const startTime = Date.now();
  const filename = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const stats = fs.statSync(filePath);
  const fileSize = stats.size;
  
  const issues: ScanIssue[] = [];
  
  try {
    // Basic file size check - overly large files might be suspicious
    if (fileSize > 10 * 1024 * 1024 * 1024) { // 10GB
      issues.push({
        id: crypto.randomUUID(),
        type: 'LARGE_FILE_SIZE',
        severity: 'LOW',
        description: 'Model file is unusually large',
        location: filePath,
        details: `File size is ${(fileSize / (1024 * 1024 * 1024)).toFixed(2)}GB which is unusually large for a standard model`,
        confidence: 'MEDIUM',
        mitigation: 'Verify the model file is not corrupted or contains unnecessary data'
      });
    }
    
    // Read part of the file to check for suspicious patterns
    // Only read the first few MB to avoid loading huge files
    const MAX_READ_BYTES = 5 * 1024 * 1024; // Read first 5MB
    const buffer = Buffer.alloc(Math.min(MAX_READ_BYTES, fileSize));
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, buffer.length, 0);
    fs.closeSync(fd);
    
    const bufferStr = buffer.toString('hex');
    
    // Check for known suspicious patterns
    const suspiciousPatterns = [
      { pattern: /eval\(/i, type: 'POTENTIAL_EXEC', severity: 'HIGH' },
      { pattern: /https?:\/\/[^\s"]*/i, type: 'EXTERNAL_URL', severity: 'MEDIUM' },
      { pattern: /subprocess|system\(/i, type: 'SUBPROCESS_CALL', severity: 'HIGH' },
      { pattern: /password|api_key|secret|token/i, type: 'SENSITIVE_DATA', severity: 'MEDIUM' },
      { pattern: /backdoor|hack/i, type: 'SUSPICIOUS_TERMS', severity: 'MEDIUM' },
    ];
    
    for (const { pattern, type, severity } of suspiciousPatterns) {
      const match = bufferStr.match(pattern);
      if (match) {
        issues.push({
          id: crypto.randomUUID(),
          type,
          severity: severity as 'HIGH' | 'MEDIUM' | 'LOW',
          description: `Potentially suspicious pattern detected: ${type}`,
          location: `${filePath}:byte-offset-${match.index || 0}`,
          details: `Found pattern matching ${pattern} in the model file`,
          confidence: 'MEDIUM',
          mitigation: 'Investigate this pattern to ensure it is not malicious'
        });
      }
    }
    
    // For common model formats, add specific checks
    if (ext === '.safetensors') {
      try {
        // Check if file follows safetensors format
        const fd = fs.openSync(filePath, 'r');
        const headerSizeBuf = Buffer.alloc(4);
        fs.readSync(fd, headerSizeBuf, 0, 4, 0);
        const headerSize = headerSizeBuf.readUInt32LE(0);

        if (headerSize <= 0 || headerSize > 1_000_000) {
          issues.push({
            id: crypto.randomUUID(),
            type: 'INVALID_FORMAT',
            severity: 'MEDIUM',
            description: `File with extension ${ext} might not be a valid model file`,
            location: filePath,
            details: 'Invalid header size in safetensors file',
            confidence: 'HIGH',
            mitigation: 'Verify the model file is not corrupted or intentionally mislabeled'
          });
        } else {
          const headerBuf = Buffer.alloc(headerSize);
          fs.readSync(fd, headerBuf, 0, headerSize, 4);
          
          try {
            const headerJson = JSON.parse(headerBuf.toString('utf8'));
            const isValidSafetensors = typeof headerJson === 'object' &&
              Object.values(headerJson).every(
                v => typeof v === 'object' &&
                     'dtype' in v &&
                     'shape' in v &&
                     'data_offsets' in v
              );
              
            if (!isValidSafetensors) {
              issues.push({
                id: crypto.randomUUID(),
                type: 'INVALID_FORMAT',
                severity: 'MEDIUM',
                description: `File with extension ${ext} might not be a valid model file`,
                location: filePath,
                details: 'Safetensors header does not contain expected tensor metadata',
                confidence: 'HIGH',
                mitigation: 'Verify the model file is not corrupted or intentionally mislabeled'
              });
            }
          } catch (error) {
            issues.push({
              id: crypto.randomUUID(),
              type: 'INVALID_FORMAT',
              severity: 'MEDIUM',
              description: `File with extension ${ext} might not be a valid model file`,
              location: filePath,
              details: error instanceof Error ? error.message : String(error),
              confidence: 'HIGH',
              mitigation: 'Verify the model file is not corrupted or intentionally mislabeled'
            });
          }
        }
        fs.closeSync(fd);
      } catch (error) {
        issues.push({
          id: crypto.randomUUID(),
          type: 'SCAN_ERROR',
          severity: 'MEDIUM',
          description: 'Error validating safetensors format',
          location: filePath,
          details: error instanceof Error ? error.message : String(error),
          confidence: 'MEDIUM',
          mitigation: 'Investigate the error and retry the scan'
        });
      }
    }
    
    // Check for unusual file permissions
    const permMode = stats.mode & 0o777;
    if (permMode > 0o644) {
      issues.push({
        id: crypto.randomUUID(),
        type: 'EXCESSIVE_PERMISSIONS',
        severity: 'LOW',
        description: 'Model file has excessive permissions',
        location: filePath,
        details: `File permission mode ${permMode.toString(8)} is higher than recommended 644`,
        confidence: 'HIGH',
        mitigation: 'Adjust file permissions to be more restrictive using chmod'
      });
    }
    
  } catch (error) {
    issues.push({
      id: crypto.randomUUID(),
      type: 'SCAN_ERROR',
      severity: 'LOW',
      description: 'Error scanning model file',
      location: filePath,
      details: error instanceof Error ? error.message : String(error),
      confidence: 'HIGH',
      mitigation: 'Investigate the error and retry the scan'
    });
  }
  
  return {
    filename: filePath,
    fileType: ext.replace('.', ''),
    fileSize,
    issues
  };
}

// Main function to perform a basic scan of model files
export async function performBasicModelScan(paths: string[]): Promise<ScanResult> {
  const startTime = Date.now();
  
  // Identify model files in the given paths
  let modelFiles: string[] = [];
  
  for (const p of paths) {
    try {
      const stats = fs.statSync(p);
      
      if (stats.isFile()) {
        if (isModelFile(p)) {
          modelFiles.push(p);
        }
      } else if (stats.isDirectory()) {
        // Recursively find model files in the directory
        const directoryFiles = walkDirectory(p);
        const filteredModelFiles = directoryFiles.filter(isModelFile);
        modelFiles = [...modelFiles, ...filteredModelFiles];
      }
    } catch (error) {
      // Skip files/directories we can't access
      console.error(`Error accessing path ${p}:`, error);
    }
  }
  
  // If no model files found but paths were provided, include them anyway
  if (modelFiles.length === 0 && paths.length > 0) {
    modelFiles = paths;
  }
  
  // Scan each model file
  const fileResults: FileResult[] = [];
  for (const file of modelFiles) {
    try {
      const result = await scanFile(file);
      fileResults.push(result);
    } catch (error) {
      console.error(`Error scanning file ${file}:`, error);
      // Add a placeholder result with an error
      fileResults.push({
        filename: file,
        fileType: path.extname(file).replace('.', ''),
        fileSize: 0,
        issues: [{
          id: crypto.randomUUID(),
          type: 'SCAN_FAILURE',
          severity: 'LOW',
          description: 'Failed to scan file',
          details: error instanceof Error ? error.message : String(error),
          mitigation: 'Check file permissions and format',
          confidence: 'HIGH'
        }]
      });
    }
  }
  
  // Calculate summary statistics
  const highSeverity = fileResults.reduce((count, file) => 
    count + file.issues.filter(i => i.severity === 'HIGH').length, 0);
  const mediumSeverity = fileResults.reduce((count, file) => 
    count + file.issues.filter(i => i.severity === 'MEDIUM').length, 0);
  const lowSeverity = fileResults.reduce((count, file) => 
    count + file.issues.filter(i => i.severity === 'LOW').length, 0);
  const totalVulnerabilities = highSeverity + mediumSeverity + lowSeverity;
  
  const endTime = Date.now();
  const scanDuration = (endTime - startTime) / 1000;
  
  return {
    summary: {
      totalFiles: fileResults.length,
      totalVulnerabilities,
      highSeverity,
      mediumSeverity,
      lowSeverity,
      scanDuration,
      scanDate: new Date().toISOString(),
    },
    files: fileResults
  };
}

// Helper function to walk a directory recursively
function walkDirectory(dir: string): string[] {
  let results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = [...results, ...walkDirectory(fullPath)];
    } else {
      results.push(fullPath);
    }
  }
  
  return results;
}
