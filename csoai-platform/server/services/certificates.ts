/**
 * Certificates Router
 * 
 * Handles certificate generation, verification, and management
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { courseCertificates, courses, courseEnrollments } from "../../drizzle/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { generateCertificatePDF } from "../utils/certificateGenerator";
import { generateCertificatePDFV2 } from "../utils/certificateGeneratorV2";
import crypto from "crypto";

export const certificatesRouter = router({
  /**
   * Generate a certificate for a completed course
   */
  generate: protectedProcedure
    .input(z.object({
      courseId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // Verify user has completed the course
        const [enrollment] = await db
          .select()
          .from(courseEnrollments)
          .where(
            and(
              eq(courseEnrollments.userId, ctx.user.id),
              eq(courseEnrollments.courseId, input.courseId),
              isNotNull(courseEnrollments.completedAt)
            )
          );

        if (!enrollment) {
          throw new Error('Course not completed');
        }

        // Check if certificate already exists
        const [existingCert] = await db
          .select()
          .from(courseCertificates)
          .where(
            and(
              eq(courseCertificates.userId, ctx.user.id),
              eq(courseCertificates.courseId, input.courseId)
            )
          );

        if (existingCert) {
          return {
            success: true,
            certificateId: existingCert.certificateId,
            message: 'Certificate already exists',
          };
        }

        // Get course details
        const [course] = await db
          .select()
          .from(courses)
          .where(eq(courses.id, input.courseId));

        if (!course) {
          throw new Error('Course not found');
        }

        // Generate unique certificate ID
        const certificateId = `COAI-${(course.framework || 'GENERAL').replace(/[^A-Z0-9]/g, '')}-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        // Generate PDF certificate (using V2 with modern template)
        const pdfBuffer = await generateCertificatePDFV2({
          certificateId,
          studentName: ctx.user.name || 'Student',
          courseName: course.title,
          framework: course.framework || 'General',
          completionDate: enrollment.completedAt || new Date(),
          verificationUrl: `${process.env.VITE_FRONTEND_FORGE_API_URL || 'https://coai.manus.space'}/verify-certificate/${certificateId}`,
        });

        // Store certificate record in database
        await db.insert(courseCertificates).values({
          userId: ctx.user.id,
          courseId: input.courseId,
          certificateId,
          issuedAt: new Date(),
        });

        return {
          success: true,
          certificateId,
          pdfData: pdfBuffer.toString('base64'),
          message: 'Certificate generated successfully',
        };
      } catch (error) {
        console.error('Error generating certificate:', error);
        throw new Error(`Failed to generate certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  /**
   * Verify a certificate by ID
   */
  verify: publicProcedure
    .input(z.object({
      certificateId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const [certificate] = await db
          .select({
            certificateId: courseCertificates.certificateId,
            issuedAt: courseCertificates.issuedAt,
            userId: courseCertificates.userId,
            courseId: courseCertificates.courseId,
            courseName: courses.title,
            framework: courses.framework,
          })
          .from(courseCertificates)
          .leftJoin(courses, eq(courseCertificates.courseId, courses.id))
          .where(eq(courseCertificates.certificateId, input.certificateId));

        if (!certificate) {
          return {
            valid: false,
            message: 'Certificate not found',
          };
        }

        return {
          valid: true,
          certificate: {
            certificateId: certificate.certificateId,
            courseName: certificate.courseName,
            framework: certificate.framework,
            issuedAt: certificate.issuedAt,
          },
          message: 'Certificate is valid',
        };
      } catch (error) {
        console.error('Error verifying certificate:', error);
        throw new Error(`Failed to verify certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  /**
   * List all certificates for the current user
   */
  list: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const certificates = await db
          .select({
            id: courseCertificates.id,
            certificateId: courseCertificates.certificateId,
            issuedAt: courseCertificates.issuedAt,
            courseName: courses.title,
            framework: courses.framework,
          })
          .from(courseCertificates)
          .leftJoin(courses, eq(courseCertificates.courseId, courses.id))
          .where(eq(courseCertificates.userId, ctx.user.id))
          .orderBy(courseCertificates.issuedAt);

        return {
          success: true,
          certificates,
        };
      } catch (error) {
        console.error('Error listing certificates:', error);
        throw new Error(`Failed to list certificates: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  /**
   * Verify a certificate by certificate number (public endpoint)
   */
  verifyCertificate: publicProcedure
    .input(z.object({
      certificateNumber: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // Look up certificate by certificate ID
        const [result] = await db
          .select({
            certificateId: courseCertificates.certificateId,
            userId: courseCertificates.userId,
            courseId: courseCertificates.courseId,
            courseName: courses.title,
            issuedAt: courseCertificates.issuedAt,
          })
          .from(courseCertificates)
          .leftJoin(courses, eq(courseCertificates.courseId, courses.id))
          .where(eq(courseCertificates.certificateId, input.certificateNumber));

        if (!result) {
          return {
            valid: false,
            message: 'Certificate not found',
          };
        }

        return {
          valid: true,
          message: 'Certificate verified successfully',
          certificate: {
            certificateNumber: result.certificateId,
            userName: 'Certificate Holder',
            courseName: result.courseName || 'AI Safety Analyst Certification',
            issuedAt: result.issuedAt,
            level: 'Professional',
          },
        };
      } catch (error) {
        console.error('Error verifying certificate:', error);
        throw new Error(`Failed to verify certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),
});
