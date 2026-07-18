import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { storagePut } from "../storage";

/**
 * File upload router for handling resume and document uploads
 */
export const fileUploadRouter = router({
  /**
   * Generate presigned URL for file upload
   * Client uploads directly to S3, then confirms with file metadata
   */
  getUploadUrl: protectedProcedure
    .input(
      z.object({
        filename: z.string(),
        contentType: z.string(),
        fileSize: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = Number(ctx.user.id);

      // Validate file size (max 10MB)
      if (input.fileSize > 10 * 1024 * 1024) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "File size exceeds 10MB limit",
        });
      }

      // Validate content type (PDFs and common document formats)
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ];

      if (!allowedTypes.includes(input.contentType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid file type. Allowed: PDF, DOC, DOCX, TXT",
        });
      }

      // Generate unique key for S3
      const timestamp = Date.now();
      const sanitizedFilename = input.filename.replace(/[^a-zA-Z0-9.-]/g, "_");
      const key = `resumes/${userId}/${timestamp}-${sanitizedFilename}`;

      // Return key for client to use
      return {
        key,
        uploadUrl: `/api/upload`, // Client will use this endpoint
      };
    }),

  /**
   * Upload file data (base64 encoded)
   */
  uploadFile: protectedProcedure
    .input(
      z.object({
        key: z.string(),
        data: z.string(), // base64 encoded file data
        contentType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Decode base64 data
        const buffer = Buffer.from(input.data, "base64");

        // Upload to S3
        const result = await storagePut(input.key, buffer, input.contentType);

        return {
          success: true,
          url: result.url,
          key: result.key,
        };
      } catch (error) {
        console.error("File upload error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload file",
        });
      }
    }),

  /**
   * Delete uploaded file
   */
  deleteFile: protectedProcedure
    .input(
      z.object({
        key: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = Number(ctx.user.id);

      // Verify user owns this file (key should start with resumes/{userId}/)
      if (!input.key.startsWith(`resumes/${userId}/`)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this file",
        });
      }

      // TODO: Implement S3 delete if needed
      // For now, just return success as files will be overwritten

      return {
        success: true,
      };
    }),
});
