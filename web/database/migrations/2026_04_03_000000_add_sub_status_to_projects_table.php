<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add sub_status column
        Schema::table('projects', function (Blueprint $table) {
            $table->string('sub_status')->nullable()->after('status');
            $table->index('sub_status');
        });

        // 2. Migrate data
        $mapping = [
            'PROPOSED'                    => ['proposed', 'draft'],
            'PENDING_MILESTONES'          => ['proposed', 'draft'],
            'PENDING_ACCOUNTING_APPROVAL' => ['proposed', 'pending_approval'],
            'PENDING_EXECUTIVE_APPROVAL'  => ['proposed', 'pending_approval'],
            'FOR_REVISION'                => ['proposed', 'for_revision'],
            'REJECTED'                    => ['proposed', 'for_revision'],
            'ONGOING'                     => ['ongoing', null],
            'COMPLETED'                   => ['completed', null],
        ];

        foreach ($mapping as $old => $new) {
            DB::table('projects')
                ->where('status', $old)
                ->update([
                    'status'     => $new[0],
                    'sub_status' => $new[1],
                ]);
        }

        // Just in case there are lowercase ones already
        DB::table('projects')
            ->where('status', 'PROPOSED')->update(['status' => 'proposed', 'sub_status' => 'draft']);
        DB::table('projects')
            ->where('status', 'ONGOING')->update(['status' => 'ongoing']);
        DB::table('projects')
            ->where('status', 'COMPLETED')->update(['status' => 'completed']);
    }

    public function down(): void
    {
        // Reverse migration is tricky because we lost information, 
        // but we can try to guess based on sub_status.
        
        $mapping = [
            ['proposed', 'draft',            'PROPOSED'],
            ['proposed', 'pending_approval', 'PENDING_ACCOUNTING_APPROVAL'],
            ['proposed', 'for_revision',     'FOR_REVISION'],
            ['ongoing',   null,              'ONGOING'],
            ['completed', null,              'COMPLETED'],
        ];

        foreach ($mapping as $m) {
            DB::table('projects')
                ->where('status', $m[0])
                ->where('sub_status', $m[1])
                ->update(['status' => $m[2]]);
        }

        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('sub_status');
        });
    }
};
