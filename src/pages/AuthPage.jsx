import React, { useState, useRef } from 'react';
import { supabase } from '../supabase';
import { Loader2, ArrowLeft, Camera, User, Calendar, Mail, Lock } from 'lucide-react';

export default function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 📝 साइन-अप का डेटा
  const [signupData, setSignupData] = useState({
    email: '',
    fullName: '',
    dob: '',
    username: '',
    password: '',
    profilePic: null,
    previewUrl: ''
  });

  // 🔑 लॉगिन का डेटा (Username से)
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });

  const fileInputRef = useRef(null);

  // 📸 प्रोफाइल फोटो चुनना (Step 3)
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSignupData({
        ...signupData,
        profilePic: file,
        previewUrl: URL.createObjectURL(file)
      });
    }
  };

  // 🚀 SIGN UP PROCESS (अकाउंट बनाना)
  const handleSignupSubmit = async () => {
    if (!signupData.username || !signupData.password) {
      setError("Please fill all fields");
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
      });

      if (authError) throw authError;

      const userId = authData.user.id;
      let finalProfilePicUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${signupData.username}`;

      if (signupData.profilePic) {
        const fileExt = signupData.profilePic.name.split('.').pop();
        const fileName = `profiles/${userId}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('yellowgram_uploads')
          .upload(fileName, signupData.profilePic, { cacheControl: '3600', upsert: false });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('yellowgram_uploads')
            .getPublicUrl(fileName);
          finalProfilePicUrl = publicUrlData.publicUrl;
        }
      }

      const { error: dbError } = await supabase
        .from('users')
        .insert([{
          id: userId,
          email: signupData.email,
          full_name: signupData.fullName,
          dob: signupData.dob,
          username: signupData.username.toLowerCase(),
          profile_pic: finalProfilePicUrl
        }]);

      if (dbError) throw dbError;

      onLogin(authData.user);

    } catch (err) {
      setError(err.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  // 🔑 LOGIN PROCESS (Username से)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let loginEmail = loginData.username;

      if (!loginEmail.includes('@')) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('username', loginData.username.toLowerCase())
          .maybeSingle();

        if (userError || !userData) {
          throw new Error("Username not found! Please check again.");
        }
        loginEmail = userData.email; 
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginData.password,
      });

      if (authError) throw authError;

      onLogin(authData.user);
    } catch (err) {
      setError(err.message || "Invalid credentials!");
    } finally {
      setLoading(false);
    }
  };

  return (
    // 🔥 यहाँ से ग्रे बैकग्राउंड और कार्ड वाला लुक हटा दिया गया है
    <div className="min-h-screen bg-white flex flex-col justify-center px-6 py-8">
      <div className="w-full max-w-md mx-auto animate-in fade-in duration-300 flex flex-col justify-center flex-1">
        
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black text-gray-900 italic tracking-tight mb-3">YellowGram</h1>
          <p className="text-gray-500 font-medium text-lg">{isLogin ? 'Welcome back, missed you!' : 'Join the most vibrant community'}</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-sm font-bold text-center mb-6 border border-red-100">
            {error}
          </div>
        )}

        {/* 🔑 LOGIN FORM */}
        {isLogin ? (
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Username or Email" 
                  value={loginData.username}
                  onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium text-lg rounded-2xl pl-14 pr-5 py-4 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all"
                  required
                />
              </div>
            </div>
            <div>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium text-lg rounded-2xl pl-14 pr-5 py-4 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all"
                  required
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black text-xl py-4 rounded-2xl shadow-lg shadow-yellow-400/30 active:scale-95 transition-all flex justify-center items-center mt-4"
            >
              {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : 'Log In'}
            </button>
          </form>
        ) : (
          
          /* 🚀 MULTI-STEP SIGNUP FORM */
          <div className="space-y-5">
            
            {/* 🔙 Back Button for Steps */}
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="flex items-center gap-1.5 text-gray-400 hover:text-gray-900 font-bold text-[15px] mb-4 transition-colors">
                <ArrowLeft className="w-5 h-5" /> Back
              </button>
            )}

            {/* --- STEP 1: Email / Mobile --- */}
            {step === 1 && (
              <div className="animate-in slide-in-from-right-8 duration-300">
                <h3 className="font-extrabold text-xl text-gray-900 mb-5">Step 1: Contact Info</h3>
                <div className="relative mb-5">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Email Address or Mobile No." 
                    value={signupData.email}
                    onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium text-lg rounded-2xl pl-14 pr-5 py-4 outline-none focus:border-yellow-400"
                  />
                </div>
                <button 
                  onClick={() => signupData.email ? setStep(2) : setError("Please enter your email or mobile")} 
                  className="w-full bg-gray-900 text-yellow-400 font-black text-xl py-4 rounded-2xl active:scale-95 transition-all mt-2"
                >
                  Next
                </button>
              </div>
            )}

            {/* --- STEP 2: Name & DOB --- */}
            {step === 2 && (
              <div className="animate-in slide-in-from-right-8 duration-300">
                <h3 className="font-extrabold text-xl text-gray-900 mb-5">Step 2: Personal Details</h3>
                <div className="relative mb-5">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({...signupData, fullName: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium text-lg rounded-2xl pl-14 pr-5 py-4 outline-none focus:border-yellow-400"
                  />
                </div>
                <div className="relative mb-5">
                  <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                  <input 
                    type="date" 
                    value={signupData.dob}
                    onChange={(e) => setSignupData({...signupData, dob: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-500 font-medium text-lg rounded-2xl pl-14 pr-5 py-4 outline-none focus:border-yellow-400"
                  />
                </div>
                <button 
                  onClick={() => (signupData.fullName && signupData.dob) ? setStep(3) : setError("Please fill all details")} 
                  className="w-full bg-gray-900 text-yellow-400 font-black text-xl py-4 rounded-2xl active:scale-95 transition-all mt-2"
                >
                  Next
                </button>
              </div>
            )}

            {/* --- STEP 3: DP, Username & Password --- */}
            {step === 3 && (
              <div className="animate-in slide-in-from-right-8 duration-300 flex flex-col items-center">
                <h3 className="font-extrabold text-xl text-gray-900 mb-6 w-full text-left">Step 3: Setup Profile</h3>
                
                {/* 📸 Profile Pic Upload */}
                <div 
                  onClick={() => fileInputRef.current.click()} 
                  className="w-28 h-28 rounded-full bg-gray-50 border-[3px] border-dashed border-gray-300 mb-8 flex items-center justify-center relative cursor-pointer overflow-hidden group hover:border-yellow-400 transition-colors shadow-sm"
                >
                  {signupData.previewUrl ? (
                    <img src={signupData.previewUrl} className="w-full h-full object-cover" alt="preview" />
                  ) : (
                    <Camera className="w-10 h-10 text-gray-400 group-hover:text-yellow-500" />
                  )}
                  <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center">
                    <span className="text-white text-sm font-bold">Upload</span>
                  </div>
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoSelect} className="hidden" />

                <div className="w-full space-y-5">
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-lg">@</span>
                    <input 
                      type="text" 
                      placeholder="Username (e.g. rahul_123)" 
                      value={signupData.username}
                      onChange={(e) => setSignupData({...signupData, username: e.target.value.trim()})}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium text-lg rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-yellow-400 lowercase"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                    <input 
                      type="password" 
                      placeholder="Create a Password" 
                      value={signupData.password}
                      onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium text-lg rounded-2xl pl-14 pr-5 py-4 outline-none focus:border-yellow-400"
                    />
                  </div>
                  <button 
                    onClick={handleSignupSubmit}
                    disabled={loading}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black text-xl py-4 rounded-2xl shadow-lg shadow-yellow-400/30 active:scale-95 transition-all flex justify-center items-center mt-4"
                  >
                    {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : 'Create Account ✨'}
                  </button>
                </div>
              </div>
            )}
            
            {/* Step Indicators */}
            <div className="flex justify-center gap-3 mt-8">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-2.5 rounded-full transition-all duration-300 ${step === i ? 'w-10 bg-yellow-400' : 'w-2.5 bg-gray-200'}`} />
              ))}
            </div>

          </div>
        )}

      </div>
      
      {/* Bottom Text */}
      <div className="mt-auto text-center pb-4 pt-10">
        <p className="text-gray-500 font-medium text-[15px]">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); setStep(1); }} 
            className="ml-2 font-black text-gray-900 hover:text-yellow-500 transition-colors"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>

    </div>
  );
}