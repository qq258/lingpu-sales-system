-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_after_sale_order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "order_no" TEXT NOT NULL,
    "store_id" INTEGER NOT NULL,
    "imei_id" INTEGER NOT NULL,
    "customer_name" TEXT,
    "customer_phone" TEXT,
    "customer_address" TEXT,
    "fault_description" TEXT NOT NULL,
    "detection_result" TEXT,
    "process_type" TEXT NOT NULL DEFAULT '',
    "repair_level" TEXT,
    "cost" REAL,
    "cost_remark" TEXT,
    "handler_id" INTEGER NOT NULL,
    "supplier_contact" TEXT,
    "supplier_status" TEXT NOT NULL DEFAULT 'none',
    "supplier_result" TEXT,
    "exchange_model_id" INTEGER,
    "exchange_imei_id" INTEGER,
    "result" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "after_sale_order_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "sys_store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "after_sale_order_handler_id_fkey" FOREIGN KEY ("handler_id") REFERENCES "sys_user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_after_sale_order" ("cost", "cost_remark", "created_at", "customer_address", "customer_name", "customer_phone", "detection_result", "exchange_imei_id", "exchange_model_id", "fault_description", "handler_id", "id", "imei_id", "order_no", "process_type", "repair_level", "result", "status", "store_id", "supplier_contact", "supplier_result", "supplier_status", "updated_at") SELECT "cost", "cost_remark", "created_at", "customer_address", "customer_name", "customer_phone", "detection_result", "exchange_imei_id", "exchange_model_id", "fault_description", "handler_id", "id", "imei_id", "order_no", "process_type", "repair_level", "result", "status", "store_id", "supplier_contact", "supplier_result", "supplier_status", "updated_at" FROM "after_sale_order";
DROP TABLE "after_sale_order";
ALTER TABLE "new_after_sale_order" RENAME TO "after_sale_order";
CREATE UNIQUE INDEX "after_sale_order_order_no_key" ON "after_sale_order"("order_no");
CREATE INDEX "after_sale_order_store_id_idx" ON "after_sale_order"("store_id");
CREATE INDEX "after_sale_order_status_idx" ON "after_sale_order"("status");
CREATE INDEX "after_sale_order_created_at_idx" ON "after_sale_order"("created_at");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
