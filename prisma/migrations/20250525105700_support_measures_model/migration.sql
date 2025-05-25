-- CreateTable
CREATE TABLE "SupportMeasures" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "header" TEXT,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "images" TEXT[],

    CONSTRAINT "SupportMeasures_pkey" PRIMARY KEY ("id")
);
