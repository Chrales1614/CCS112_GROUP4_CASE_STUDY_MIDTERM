<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Drop the existing foreign key
            $table->dropForeign(['project_id']);
            
            // Add the new foreign key with cascade delete
            $table->foreign('project_id')
                  ->references('id')
                  ->on('projects')
                  ->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Drop the cascading foreign key
            $table->dropForeign(['project_id']);
            
            // Restore the original foreign key without cascade
            $table->foreign('project_id')
                  ->references('id')
                  ->on('projects');
        });
    }
}; 