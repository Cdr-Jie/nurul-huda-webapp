import { Link, useNavigate } from "react-router-dom"; 
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { passwordSchema } from "../lib/validation";
import { authClient } from '../lib/auth-client';


const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: passwordSchema,
});

type LoginData = z.infer<typeof loginSchema>;

const LoginCard = () => {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const navigate = useNavigate();

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleLogin = async (data: LoginData) => {
    setLoading(true);
    setServerError(null);

    // Better Auth Sign In
    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });

    if (error) {
      // Better Auth returns error messages in the error object
      setServerError(error.message || "Error had occured during sign in");
      setLoading(false);
      return;
    }

    // Success! Navigate to admin
    navigate("/admin");
  };

  // Social Login Handler (Example using Better Auth for when you're ready)
  // const handleSocialLogin = async (provider: 'google' | 'facebook') => {
  //   const { error } = await authClient.signIn.social({
  //     provider,
  //     callbackURL: `${window.location.origin}/admin`, // Redirect after login
  //   });
  //   if (error) setServerError(error.message);
  // };

  return (
    <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Log Masuk</h2>
        <p className="text-gray-500 mt-2">Pentadbir Masjid Nurul Huda</p>
      </div>

      <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-6">
        {/* EMAIL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Emel</label>
          <input
            type="email"
            placeholder="nama@contoh.com"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition"
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-red-500 text-sm mt-2">{form.formState.errors.email.message}</p>
          )}
        </div>

        {/* PASSWORD */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kata Laluan</label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition"
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-red-500 text-sm mt-2">{form.formState.errors.password.message}</p>
          )}
        </div>

        {serverError && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
        >
          {loading ? "Sila tunggu..." : "Masuk"}
        </button>

        {/* Divider */}
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-500">atau teruskan dengan</span>
          </div>
        </div>

        {/* Social Login Buttons */}
        {/* <div className="space-y-3">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-3 hover:bg-gray-50 transition"
            onClick={() => handleSocialLogin('google')}
          >
            <GlobeAltIcon className="w-5 h-5 text-gray-600" />
            <span className="font-medium">Google</span>
          </button>
        </div> */}

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Tiada akaun?
            <Link to="/signup" className="ml-2 text-blue-600 hover:underline font-medium">
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginCard;