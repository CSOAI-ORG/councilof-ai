import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { getDb } from "../db";
import { aiSystems } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

// Validation schema for AI system import
const aiSystemImportSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  systemType: z.enum([
    "chatbot",
    "recommendation",
    "classification",
    "generation",
    "analysis",
    "other",
  ]),
  riskLevel: z.enum(["minimal", "limited", "high", "unacceptable"]).optional(),
  department: z.string().optional(),
  owner: z.string().optional(),
  version: z.string().optional(),
  dataSource: z.string().optional(),
});

type AISystemImport = z.infer<typeof aiSystemImportSchema>;

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: any;
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: ValidationError[];
  duplicates: string[];
}

/**
 * Automatically classify risk level based on system type
 */
function classifyRiskLevel(systemType: string): "minimal" | "limited" | "high" | "unacceptable" {
  const highRiskTypes = ["classification", "generation"];
  const limitedRiskTypes = ["chatbot", "recommendation", "analysis"];
  const minimalRiskTypes = ["other"];

  if (highRiskTypes.includes(systemType)) {
    return "high";
  } else if (limitedRiskTypes.includes(systemType)) {
    return "limited";
  } else {
    return "minimal";
  }
}

/**
 * Validate and parse a single row of AI system data
 */
function validateRow(row: any, rowIndex: number): { data: AISystemImport; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  try {
    // Parse and validate the row
    const parsed = aiSystemImportSchema.parse(row);

    // Auto-classify risk level if not provided
    if (!parsed.riskLevel) {
      parsed.riskLevel = classifyRiskLevel(parsed.systemType);
    }

    return { data: parsed, errors };
  } catch (error: any) {
    if (error.errors) {
      error.errors.forEach((err: any) => {
        errors.push({
          row: rowIndex,
          field: err.path.join("."),
          message: err.message,
          value: row[err.path[0]],
        });
      });
    }
    return { data: row, errors };
  }
}

/**
 * Check for duplicate AI systems by name and user
 */
async function checkDuplicates(
  systems: AISystemImport[],
  userId: number
): Promise<{ duplicates: string[]; uniqueSystems: AISystemImport[] }> {
  const duplicates: string[] = [];
  const uniqueSystems: AISystemImport[] = [];

  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  for (const system of systems) {
    const existing = await db
      .select()
      .from(aiSystems)
      .where(and(eq(aiSystems.name, system.name), eq(aiSystems.userId, userId)))
      .limit(1);

    if (existing.length > 0) {
      duplicates.push(system.name);
    } else {
      uniqueSystems.push(system);
    }
  }

  return { duplicates, uniqueSystems };
}

export const bulkImportRouter = router({
  /**
   * Parse and import AI systems from CSV data
   */
  importFromCSV: protectedProcedure
    .input(
      z.object({
        csvData: z.string(),
      })
    )
    .mutation(async ({ ctx, input }): Promise<ImportResult> => {
      const userId = Number(ctx.user.id);
      const errors: ValidationError[] = [];
      const validSystems: AISystemImport[] = [];

      // Parse CSV
      const parseResult = Papa.parse(input.csvData, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => {
          // Normalize header names (remove spaces, convert to camelCase)
          return header
            .trim()
            .replace(/\s+/g, "_")
            .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
            .replace(/^_/, "");
        },
      });

      if (parseResult.errors.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `CSV parsing error: ${parseResult.errors[0].message}`,
        });
      }

      // Validate each row
      parseResult.data.forEach((row: any, index: number) => {
        const { data, errors: rowErrors } = validateRow(row, index + 2); // +2 for header and 1-based indexing

        if (rowErrors.length > 0) {
          errors.push(...rowErrors);
        } else {
          validSystems.push(data);
        }
      });

      // Check for duplicates
      const { duplicates, uniqueSystems } = await checkDuplicates(validSystems, userId);

      // Insert unique systems in a transaction
      let imported = 0;
      if (uniqueSystems.length > 0) {
        try {
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

          const insertData = uniqueSystems.map((system) => ({
            ...system,
            userId,
            status: "active" as const,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));

          await db.insert(aiSystems).values(insertData);
          imported = uniqueSystems.length;
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Database insertion error: ${error.message}`,
          });
        }
      }

      return {
        success: errors.length === 0,
        imported,
        skipped: duplicates.length,
        errors,
        duplicates,
      };
    }),

  /**
   * Parse and import AI systems from Excel data
   */
  importFromExcel: protectedProcedure
    .input(
      z.object({
        excelData: z.string(), // Base64 encoded Excel file
      })
    )
    .mutation(async ({ ctx, input }): Promise<ImportResult> => {
      const userId = Number(ctx.user.id);
      const errors: ValidationError[] = [];
      const validSystems: AISystemImport[] = [];

      try {
        // Decode base64 and parse Excel
        const buffer = Buffer.from(input.excelData, "base64");
        const workbook = XLSX.read(buffer, { type: "buffer" });

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const data = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
        }) as any[][];

        if (data.length < 2) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Excel file must contain at least a header row and one data row",
          });
        }

        // Extract headers and normalize
        const headers = data[0].map((header: string) =>
          header
            .trim()
            .replace(/\s+/g, "_")
            .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
            .replace(/^_/, "")
        );

        // Convert rows to objects
        const rows = data.slice(1).map((row) => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || "";
          });
          return obj;
        });

        // Validate each row
        rows.forEach((row: any, index: number) => {
          const { data, errors: rowErrors } = validateRow(row, index + 2); // +2 for header and 1-based indexing

          if (rowErrors.length > 0) {
            errors.push(...rowErrors);
          } else {
            validSystems.push(data);
          }
        });

        // Check for duplicates
        const { duplicates, uniqueSystems } = await checkDuplicates(validSystems, userId);

        // Insert unique systems in a transaction
        let imported = 0;
        if (uniqueSystems.length > 0) {
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

          const insertData = uniqueSystems.map((system) => ({
            ...system,
            userId,
            status: "active" as const,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));

          await db.insert(aiSystems).values(insertData);
          imported = uniqueSystems.length;
        }

        return {
          success: errors.length === 0,
          imported,
          skipped: duplicates.length,
          errors,
          duplicates,
        };
      } catch (error: any) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Excel parsing error: ${error.message}`,
        });
      }
    }),

  /**
   * Get CSV template for bulk import
   */
  getCSVTemplate: protectedProcedure.query(() => {
    const template = `name,description,systemType,riskLevel,department,owner,version,dataSource
ChatBot Pro,Customer service chatbot,chatbot,limited,Customer Support,John Doe,1.0,Customer interactions
RecommendAI,Product recommendation engine,recommendation,limited,Marketing,Jane Smith,2.1,Purchase history
ContentGuard,Content moderation system,content_moderation,high,Trust & Safety,Mike Johnson,1.5,User-generated content`;

    return {
      template,
      filename: "ai_systems_template.csv",
    };
  }),

  /**
   * Get field descriptions for import
   */
  getFieldDescriptions: protectedProcedure.query(() => {
    return {
      fields: [
        {
          name: "name",
          required: true,
          description: "Name of the AI system",
          example: "ChatBot Pro",
        },
        {
          name: "description",
          required: true,
          description: "Detailed description of the AI system's purpose and functionality",
          example: "Customer service chatbot for handling support inquiries",
        },
        {
          name: "systemType",
          required: true,
          description: "Type of AI system",
          options: [
            "chatbot",
            "recommendation",
            "content_moderation",
            "decision_support",
            "autonomous",
            "predictive_analytics",
            "computer_vision",
            "nlp",
            "other",
          ],
          example: "chatbot",
        },
        {
          name: "riskLevel",
          required: false,
          description: "Risk classification (auto-classified if not provided)",
          options: ["minimal", "limited", "high", "unacceptable"],
          example: "limited",
        },
        {
          name: "department",
          required: false,
          description: "Department or team responsible for the AI system",
          example: "Customer Support",
        },
        {
          name: "owner",
          required: false,
          description: "Primary owner or contact person",
          example: "John Doe",
        },
        {
          name: "version",
          required: false,
          description: "Current version of the AI system",
          example: "1.0",
        },
        {
          name: "dataSource",
          required: false,
          description: "Primary data sources used by the AI system",
          example: "Customer interactions, support tickets",
        },
      ],
      riskClassification: {
        high: ["autonomous", "decision_support", "content_moderation"],
        limited: ["chatbot", "recommendation", "predictive_analytics"],
        minimal: ["nlp", "computer_vision", "other"],
      },
    };
  }),
});
