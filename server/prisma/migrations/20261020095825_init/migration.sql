-- CreateTable
CREATE TABLE "Workshop" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "instructor" VARCHAR(255) NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "seatsLeft" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workshop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" SERIAL NOT NULL,
    "workshopId" INTEGER NOT NULL,
    "studentName" VARCHAR(255) NOT NULL,
    "studentEmail" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Workshop_startsAt_idx" ON "Workshop"("startsAt");

-- CreateIndex
CREATE INDEX "Booking_workshopId_idx" ON "Booking"("workshopId");

-- CreateIndex
CREATE INDEX "Booking_studentEmail_idx" ON "Booking"("studentEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_workshopId_studentEmail_key" ON "Booking"("workshopId", "studentEmail");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Check Constraints for Data Integrity
ALTER TABLE "Workshop" ADD CONSTRAINT "check_capacity_positive" CHECK ("capacity" > 0);
ALTER TABLE "Workshop" ADD CONSTRAINT "check_seats_left_non_negative" CHECK ("seatsLeft" >= 0);
ALTER TABLE "Workshop" ADD CONSTRAINT "check_seats_left_lte_capacity" CHECK ("seatsLeft" <= "capacity");
