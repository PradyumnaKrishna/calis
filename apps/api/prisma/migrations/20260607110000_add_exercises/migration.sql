-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "source_exercise_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "body_parts_json" TEXT NOT NULL,
    "equipment_json" TEXT NOT NULL,
    "target_muscles_json" TEXT NOT NULL,
    "secondary_muscles_json" TEXT NOT NULL,
    "instructions_json" TEXT NOT NULL,
    "gif_url" TEXT NOT NULL,
    "local_gif_path" TEXT NOT NULL,
    "raw_json" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "exercises_source_exercise_id_key" ON "exercises"("source_exercise_id");

-- CreateIndex
CREATE UNIQUE INDEX "exercises_slug_key" ON "exercises"("slug");

-- CreateIndex
CREATE INDEX "exercises_name_idx" ON "exercises"("name");
