-- CreateTable
CREATE TABLE "questionnaires" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "version" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "questionnaire_steps" (
    "questionnaire_id" TEXT NOT NULL,
    "step_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "eyebrow" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "hint" TEXT NOT NULL,
    "min_selections" INTEGER,
    "max_selections" INTEGER,

    PRIMARY KEY ("questionnaire_id", "step_id"),
    CONSTRAINT "questionnaire_steps_questionnaire_id_fkey" FOREIGN KEY ("questionnaire_id") REFERENCES "questionnaires" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "questionnaire_options" (
    "questionnaire_id" TEXT NOT NULL,
    "step_id" TEXT NOT NULL,
    "option_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "score" INTEGER,

    PRIMARY KEY ("questionnaire_id", "step_id", "option_id"),
    CONSTRAINT "questionnaire_options_questionnaire_id_step_id_fkey" FOREIGN KEY ("questionnaire_id", "step_id") REFERENCES "questionnaire_steps" ("questionnaire_id", "step_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "questionnaires_slug_key" ON "questionnaires"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "questionnaire_steps_questionnaire_id_position_key" ON "questionnaire_steps"("questionnaire_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "questionnaire_options_questionnaire_id_step_id_position_key" ON "questionnaire_options"("questionnaire_id", "step_id", "position");
