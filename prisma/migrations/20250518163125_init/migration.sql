-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'MANAGER';

-- CreateTable
CREATE TABLE "_EmployeeToStore" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_EmployeeToStore_AB_unique" ON "_EmployeeToStore"("A", "B");

-- CreateIndex
CREATE INDEX "_EmployeeToStore_B_index" ON "_EmployeeToStore"("B");

-- AddForeignKey
ALTER TABLE "_EmployeeToStore" ADD CONSTRAINT "_EmployeeToStore_A_fkey" FOREIGN KEY ("A") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EmployeeToStore" ADD CONSTRAINT "_EmployeeToStore_B_fkey" FOREIGN KEY ("B") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
