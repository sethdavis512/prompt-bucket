-- AlterTable
ALTER TABLE "public"."prompts" ADD COLUMN     "backgroundDataScore" INTEGER DEFAULT 0,
ADD COLUMN     "conversationScore" INTEGER DEFAULT 0,
ADD COLUMN     "detailedTaskScore" INTEGER DEFAULT 0,
ADD COLUMN     "examplesScore" INTEGER DEFAULT 0,
ADD COLUMN     "immediateTaskScore" INTEGER DEFAULT 0,
ADD COLUMN     "outputFormattingScore" INTEGER DEFAULT 0,
ADD COLUMN     "prefilledResponseScore" INTEGER DEFAULT 0,
ADD COLUMN     "taskContextScore" INTEGER DEFAULT 0,
ADD COLUMN     "thinkingStepsScore" INTEGER DEFAULT 0,
ADD COLUMN     "toneContextScore" INTEGER DEFAULT 0,
ADD COLUMN     "totalScore" INTEGER DEFAULT 0;
