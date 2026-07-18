/**
 * PDCA Templates Router
 * Handles downloading of SOAI-PDCA phase templates
 */

import { router, publicProcedure } from '../_core/trpc.js';
import { z } from 'zod';
import { listAvailableTemplates } from '../utils/pdcaTemplateGenerator';

export const pdcaTemplatesRouter = router({
  listTemplates: publicProcedure.query(() => {
    return listAvailableTemplates();
  }),

  getTemplateDownloadUrl: publicProcedure
    .input(
      z.object({
        templateId: z.string(),
      })
    )
    .query(({ input }: { input: { templateId: string } }) => {
      // Return API endpoint for download
      return {
        downloadUrl: `/api/download-template/${input.templateId}`,
      };
    }),
});
