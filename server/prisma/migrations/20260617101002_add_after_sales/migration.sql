-- AlterTable
ALTER TABLE "wh_inventory_imei" ADD COLUMN "after_sale_order_id" INTEGER;

-- CreateTable
CREATE TABLE "after_sale_order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "order_no" TEXT NOT NULL,
    "store_id" INTEGER NOT NULL,
    "imei_id" INTEGER NOT NULL,
    "customer_name" TEXT,
    "customer_phone" TEXT,
    "customer_address" TEXT,
    "fault_description" TEXT NOT NULL,
    "detection_result" TEXT,
    "process_type" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "after_sale_log" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "order_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "operator_id" INTEGER,
    "content" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "after_sale_log_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "after_sale_order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "after_sale_log_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "sys_user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "after_sale_order_order_no_key" ON "after_sale_order"("order_no");

-- CreateIndex
CREATE INDEX "after_sale_order_store_id_idx" ON "after_sale_order"("store_id");

-- CreateIndex
CREATE INDEX "after_sale_order_status_idx" ON "after_sale_order"("status");

-- CreateIndex
CREATE INDEX "after_sale_order_created_at_idx" ON "after_sale_order"("created_at");

-- CreateIndex
CREATE INDEX "after_sale_log_order_id_idx" ON "after_sale_log"("order_id");
