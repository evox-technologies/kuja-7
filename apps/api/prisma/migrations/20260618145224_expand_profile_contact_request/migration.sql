-- CreateEnum
CREATE TYPE "ContactRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "address" TEXT,
ADD COLUMN     "birthDay" TEXT,
ADD COLUMN     "caste" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "civilStatus" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "drinking" TEXT,
ADD COLUMN     "educationLevel" TEXT,
ADD COLUMN     "ethnicity" TEXT,
ADD COLUMN     "foodPreference" TEXT,
ADD COLUMN     "height" TEXT,
ADD COLUMN     "images" TEXT[],
ADD COLUMN     "kujaNumber" TEXT,
ADD COLUMN     "mobileNumber" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "smoking" TEXT,
ADD COLUMN     "stateDistrict" TEXT,
ADD COLUMN     "whatsappNumber" TEXT;

-- CreateTable
CREATE TABLE "contact_requests" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "status" "ContactRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contact_requests_requesterId_targetId_key" ON "contact_requests"("requesterId", "targetId");

-- AddForeignKey
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
