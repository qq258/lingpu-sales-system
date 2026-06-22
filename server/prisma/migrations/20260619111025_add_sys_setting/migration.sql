/*
  Warnings:

  - You are about to drop the column `battery` on the `pdt_model` table. All the data in the column will be lost.
  - You are about to drop the column `cpu` on the `pdt_model` table. All the data in the column will be lost.
  - You are about to drop the column `launch_year` on the `pdt_model` table. All the data in the column will be lost.
  - You are about to drop the column `manufacturer_barcode` on the `pdt_model` table. All the data in the column will be lost.
  - You are about to drop the column `network_type` on the `pdt_model` table. All the data in the column will be lost.
  - You are about to drop the column `os_type` on the `pdt_model` table. All the data in the column will be lost.
  - You are about to drop the column `ram` on the `pdt_model` table. All the data in the column will be lost.
  - You are about to drop the column `rom` on the `pdt_model` table. All the data in the column will be lost.
  - You are about to drop the column `screen_size` on the `pdt_model` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "sys_setting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '',
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_pdt_model" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "memory" TEXT,
    "sale_price" REAL NOT NULL,
    "cost_price" REAL,
    "image_path" TEXT,
    "is_subsidy" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "status" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pdt_model_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "pdt_brand" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_pdt_model" ("brand_id", "color", "cost_price", "created_at", "description", "id", "image_path", "name", "sale_price", "status") SELECT "brand_id", "color", "cost_price", "created_at", "description", "id", "image_path", "name", "sale_price", "status" FROM "pdt_model";
DROP TABLE "pdt_model";
ALTER TABLE "new_pdt_model" RENAME TO "pdt_model";
CREATE INDEX "pdt_model_brand_id_idx" ON "pdt_model"("brand_id");
CREATE INDEX "pdt_model_name_idx" ON "pdt_model"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "sys_setting_key_key" ON "sys_setting"("key");
