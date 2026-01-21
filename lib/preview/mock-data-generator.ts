/**
 * @fileoverview Generate realistic mock data for preview
 * 
 * Phase 1: Live Preview Infrastructure
 * Creates sample data based on column types and names
 */

import type { TableDefinition, ColumnDefinition, PostgresType } from "@/types/schema";
import type { MockRecord, MockTableData } from "./types";

const SAMPLE_NAMES = [
  "John Doe", "Jane Smith", "Robert Johnson", "Emily Davis", "Michael Brown",
  "Sarah Wilson", "David Martinez", "Lisa Anderson", "James Taylor", "Maria Garcia"
];

const SAMPLE_EMAILS = [
  "john.doe@example.com", "jane.smith@example.com", "robert.j@example.com",
  "emily.d@example.com", "michael.b@example.com", "sarah.w@example.com"
];

const SAMPLE_COMPANIES = [
  "Acme Corp", "TechStart Inc", "Global Solutions", "Innovation Labs",
  "Digital Dynamics", "Future Systems", "Smart Ventures", "Prime Industries"
];

const SAMPLE_ADDRESSES = [
  "123 Main St, New York, NY 10001",
  "456 Oak Ave, Los Angeles, CA 90001",
  "789 Pine Rd, Chicago, IL 60601",
  "321 Elm St, Houston, TX 77001",
  "654 Maple Dr, Phoenix, AZ 85001"
];

const SAMPLE_CITIES = [
  "New York", "Los Angeles", "Chicago", "Houston", "Phoenix",
  "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"
];

const SAMPLE_STATUSES = [
  "active", "pending", "completed", "cancelled", "in_progress",
  "draft", "published", "archived"
];

/**
 * Generate mock data for a single table
 */
export function generateMockTableData(
  table: TableDefinition,
  recordCount: number = 5
): MockTableData {
  const records: MockRecord[] = [];

  for (let i = 0; i < recordCount; i++) {
    const record: MockRecord = {
      id: `mock-${table.name}-${i + 1}`,
      user_id: "mock-user-id",
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Generate values for each column
    table.columns.forEach(column => {
      // Skip audit columns
      if (["id", "user_id", "created_at", "updated_at"].includes(column.name)) {
        return;
      }

      record[column.name] = generateMockValue(column, i);
    });

    records.push(record);
  }

  return {
    tableName: table.name,
    records,
  };
}

/**
 * Generate mock data for all tables in schema
 */
export function generateMockData(schema: any): MockTableData[] {
  return schema.tables.map((table: TableDefinition) => generateMockTableData(table));
}

/**
 * Generate a mock value based on column definition
 */
function generateMockValue(column: ColumnDefinition, index: number): any {
  const columnName = column.name.toLowerCase();
  const type = column.type;

  // Handle by column name patterns first
  if (columnName.includes("name")) {
    return SAMPLE_NAMES[index % SAMPLE_NAMES.length];
  }

  if (columnName.includes("email")) {
    return SAMPLE_EMAILS[index % SAMPLE_EMAILS.length];
  }

  if (columnName.includes("company") || columnName.includes("organization")) {
    return SAMPLE_COMPANIES[index % SAMPLE_COMPANIES.length];
  }

  if (columnName.includes("address")) {
    return SAMPLE_ADDRESSES[index % SAMPLE_ADDRESSES.length];
  }

  if (columnName.includes("city")) {
    return SAMPLE_CITIES[index % SAMPLE_CITIES.length];
  }

  if (columnName.includes("status")) {
    return SAMPLE_STATUSES[index % SAMPLE_STATUSES.length];
  }

  if (columnName.includes("phone")) {
    return `+1 (555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  }

  if (columnName.includes("price") || columnName.includes("amount") || columnName.includes("cost")) {
    return Math.floor(Math.random() * 100000) + 10000;
  }

  if (columnName.includes("description") || columnName.includes("notes")) {
    return `Sample ${columnName} for record ${index + 1}. This is placeholder text for preview purposes.`;
  }

  if (columnName.includes("url") || columnName.includes("website")) {
    return `https://example-${index + 1}.com`;
  }

  // Handle by PostgreSQL type
  switch (type) {
    case "TEXT":
    case "VARCHAR":
      return `Sample ${column.name} ${index + 1}`;

    case "INTEGER":
    case "BIGINT":
      return Math.floor(Math.random() * 1000) + 1;

    case "NUMERIC":
      return (Math.random() * 10000).toFixed(2);

    case "BOOLEAN":
      return Math.random() > 0.5;

    case "DATE":
      return new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

    case "TIMESTAMP":
    case "TIMESTAMPTZ":
      return new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();

    case "UUID":
      return `mock-uuid-${index + 1}`;

    case "JSONB":
      return { sample: true, index: index + 1 };

    default:
      return `Sample value ${index + 1}`;
  }
}

/**
 * Generate related mock data (for foreign keys)
 */
export function generateRelatedMockData(
  fromTable: string,
  toTable: string,
  recordCount: number
): string[] {
  return Array.from({ length: recordCount }, (_, i) => `mock-${toTable}-${i + 1}`);
}

/**
 * Update mock data with user changes (for interactive preview)
 */
export function updateMockRecord(
  mockData: MockTableData[],
  tableName: string,
  recordId: string,
  updates: Partial<MockRecord>
): MockTableData[] {
  return mockData.map(tableData => {
    if (tableData.tableName !== tableName) {
      return tableData;
    }

    return {
      ...tableData,
      records: tableData.records.map(record =>
        record.id === recordId
          ? { ...record, ...updates, updated_at: new Date().toISOString() }
          : record
      ),
    };
  });
}

/**
 * Add new mock record
 */
export function addMockRecord(
  mockData: MockTableData[],
  tableName: string,
  table: TableDefinition
): MockTableData[] {
  return mockData.map(tableData => {
    if (tableData.tableName !== tableName) {
      return tableData;
    }

    const newIndex = tableData.records.length;
    const newRecord: MockRecord = {
      id: `mock-${tableName}-${newIndex + 1}`,
      user_id: "mock-user-id",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    table.columns.forEach(column => {
      if (!["id", "user_id", "created_at", "updated_at"].includes(column.name)) {
        newRecord[column.name] = generateMockValue(column, newIndex);
      }
    });

    return {
      ...tableData,
      records: [...tableData.records, newRecord],
    };
  });
}

/**
 * Delete mock record
 */
export function deleteMockRecord(
  mockData: MockTableData[],
  tableName: string,
  recordId: string
): MockTableData[] {
  return mockData.map(tableData => {
    if (tableData.tableName !== tableName) {
      return tableData;
    }

    return {
      ...tableData,
      records: tableData.records.filter(record => record.id !== recordId),
    };
  });
}
