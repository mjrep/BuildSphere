<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('task_progress_logs', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->unsignedBigInteger('task_id');
            $table->unsignedBigInteger('milestone_id');
            $table->unsignedBigInteger('created_by');

            $table->integer('quantity_accomplished');
            $table->string('evidence_image_path')->nullable();
            $table->text('remarks')->nullable();
            $table->string('ai_verification_status', 30)->default('pending');

            $table->timestamps();

            // Foreign keys
            $table->foreign('task_id')
                  ->references('id')->on('tasks')
                  ->onDelete('cascade');

            $table->foreign('milestone_id')
                  ->references('id')->on('project_milestones')
                  ->onDelete('cascade');

            $table->foreign('created_by')
                  ->references('id')->on('users')
                  ->onDelete('restrict');

            // Indexes
            $table->index('task_id');
            $table->index('milestone_id');
            $table->index('created_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_progress_logs');
    }
};
