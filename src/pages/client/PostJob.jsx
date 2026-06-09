/**
 * pages/client/PostJob.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FIXES applied:
 * 1. useGeolocation() used for real coordinates — no hardcoded [77.209, 28.6139]
 * 2. Uses jobsApi.create (POST /jobs/create) instead of POST /jobs
 * 3. Shows a location permission prompt if geo is denied
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MapPin, Briefcase, DollarSign, FileText, Send, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useJobs } from '../../hooks/useJobs';
import { useGeolocation } from '../../hooks/useGeolocation';

const jobSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  category: z.string().min(1, 'Please select a category'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  skills: z.string().optional(),
  minBudget: z.coerce.number().min(500, 'Minimum budget is ₹500'),
  maxBudget: z.coerce.number().min(1000, 'Maximum budget is ₹1000'),
  radius: z.coerce.number().min(5).max(200),
}).refine((d) => d.maxBudget > d.minBudget, {
  message: 'Max budget must be greater than min budget',
  path: ['maxBudget'],
});

const CATEGORIES = [
  'Design & Creative',
  'Development & IT',
  'Writing & Translation',
  'Marketing & Sales',
  'Home Services',
  'Teaching & Training',
  'Legal & Finance',
];

const PostJob = () => {
  const navigate = useNavigate();
  const { postJob, isPostingJob } = useJobs();

  // Real user location — no more hardcoded Delhi coords
  const geo = useGeolocation();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: { radius: 25 },
  });

  const onSubmit = async (data) => {
    await postJob({
      title: data.title,
      category: data.category,
      description: data.description,
      skills: data.skills ? data.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      minBudget: data.minBudget,
      maxBudget: data.maxBudget,
      location: {
        type: 'Point',
        coordinates: [geo.longitude ?? 77.209, geo.latitude ?? 28.6139],
        address: geo.city || 'Location not specified',
      },
      radius: data.radius,
    });
    navigate('/client/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 lg:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Post a New Job</h1>
          <p className="text-gray-400 mt-2">Connect with nearby talent by describing your requirements.</p>
        </div>

        {/* Location status banner */}
        {geo.error && (
          <div className="mb-6 flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-400 text-sm">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Location access denied</p>
              <p className="text-amber-500/80 mt-0.5">Your job will use a default location. Enable location in browser settings for better results.</p>
            </div>
          </div>
        )}

        {geo.latitude && !geo.error && (
          <div className="mb-6 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-400 text-sm">
            <MapPin className="w-4 h-4" />
            <span>Posting from <strong>{geo.city}</strong></span>
          </div>
        )}

        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 lg:p-8 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" /> Job Title
              </label>
              <input
                {...register('title')}
                type="text"
                placeholder="e.g. Mobile App UI/UX Design"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                {...register('category')}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">Select a category…</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" /> Job Description
              </label>
              <textarea
                {...register('description')}
                rows="5"
                placeholder="Describe the work, deliverables, timeline expectations…"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none transition-colors"
              />
              {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Required Skills (comma-separated)</label>
              <input
                {...register('skills')}
                type="text"
                placeholder="e.g. Figma, React, Node.js"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Budget + Radius */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" /> Min Budget (₹)
                </label>
                <input
                  {...register('minBudget')}
                  type="number"
                  placeholder="500"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
                {errors.minBudget && <p className="text-red-400 text-xs mt-1">{errors.minBudget.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Budget (₹)</label>
                <input
                  {...register('maxBudget')}
                  type="number"
                  placeholder="5000"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
                {errors.maxBudget && <p className="text-red-400 text-xs mt-1">{errors.maxBudget.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-400" /> Search Radius (km)
                </label>
                <input
                  {...register('radius')}
                  type="number"
                  placeholder="25"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-gray-700">
              <button
                type="submit"
                disabled={isPostingJob || geo.loading}
                className="w-full flex justify-center items-center gap-2 py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl disabled:opacity-50 transition-colors"
              >
                {isPostingJob
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Posting…</>
                  : <><Send className="w-5 h-5" /> Post Job Now</>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostJob;
