-- CreateEnum
CREATE TYPE "VisualFormat" AS ENUM ('waveform', 'bars', 'spectrum');

-- CreateEnum
CREATE TYPE "FontType" AS ENUM ('rubik-glitch', 'kapakana', 'shadows');

-- CreateTable
CREATE TABLE "audio_items" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "audio_url" TEXT NOT NULL,
    "duration_ms" INTEGER,
    "visual_format" "VisualFormat" NOT NULL DEFAULT 'waveform',
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "scale" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audio_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "text_items" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "font" "FontType" NOT NULL DEFAULT 'rubik-glitch',
    "opacity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "scale" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "text_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audio_items_owner_id_idx" ON "audio_items"("owner_id");

-- CreateIndex
CREATE INDEX "text_items_owner_id_idx" ON "text_items"("owner_id");
