<?php

namespace App\Http\Controllers;

use App\Models\Risk;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RiskController extends Controller
{
    public function index()
    {
        return Risk::orderBy('created_at', 'desc')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'severity' => ['required', Rule::in(['low', 'medium', 'high', 'critical'])],
            'status' => ['required', Rule::in(['open', 'in-progress', 'resolved'])],
            'mitigation' => 'required|string',
        ]);

        $risk = Risk::create($validated);
        return response()->json($risk, 201);
    }

    public function show(Risk $risk)
    {
        return $risk;
    }

    public function update(Request $request, Risk $risk)
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'severity' => ['sometimes', Rule::in(['low', 'medium', 'high', 'critical'])],
            'status' => ['sometimes', Rule::in(['open', 'in-progress', 'resolved'])],
            'mitigation' => 'sometimes|string',
        ]);

        $risk->update($validated);
        return response()->json($risk);
    }

    public function destroy(Risk $risk)
    {
        $risk->delete();
        return response()->json(null, 204);
    }
} 