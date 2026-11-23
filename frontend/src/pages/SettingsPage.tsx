import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { addToast } from '../store/slices/uiSlice';
import { Settings, User, Bell, Key, Shield, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const [defaultImageModel, setDefaultImageModel] = useState('qwen-2.5-image-turbo');
  const [defaultVideoModel, setDefaultVideoModel] = useState('qwen-wan2.1-video-turbo');
  const [notifications, setNotifications] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(addToast({ type: 'success', message: 'Settings saved successfully' }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-purple-400" />
          <span>Account & Preferences</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Customize your default generation models, profile info, and security preferences.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        {/* Profile Card */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
          <img
            src={
              user?.avatarUrl ||
              `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user?.name || 'User')}`
            }
            alt="Profile avatar"
            className="w-16 h-16 rounded-full border-2 border-purple-500/40"
          />
          <div>
            <div className="font-bold text-lg text-white">{user?.name}</div>
            <div className="text-xs text-slate-400">{user?.email}</div>
            <div className="mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
              Role: {user?.role}
            </div>
          </div>
        </div>

        {/* Model Preferences */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-400" />
              <span>Generation Preferences</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Default Image Model
                </label>
                <select
                  value={defaultImageModel}
                  onChange={(e) => setDefaultImageModel(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
                >
                  <option value="qwen-2.5-image-turbo">Qwen 2.5 Image Turbo (WanX 2.1)</option>
                  <option value="qwen-2.5-max-image">Qwen 2.5 Max Image Ultra</option>
                  <option value="wanx-2.1-t2i-plus">Alibaba WanX 2.1 Plus</option>
                  <option value="qwen-2.5-vl-ultra">Qwen 2.5 VL Ultra</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Default Video Model
                </label>
                <select
                  value={defaultVideoModel}
                  onChange={(e) => setDefaultVideoModel(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
                >
                  <option value="qwen-wan2.1-video-turbo">Qwen Wan 2.1 Video Turbo</option>
                  <option value="qwen-wan2.1-video-plus">Qwen Wan 2.1 Video Plus</option>
                  <option value="qwen-omni-motion">Qwen Omni Motion 2.5</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications Toggle */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-400" />
              <div>
                <div className="text-xs font-semibold text-white">Browser Notifications</div>
                <div className="text-[11px] text-slate-400">Receive toasts when long video tasks finish</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
