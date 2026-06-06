import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; 
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { passwordSchema } from "../lib/validation";
import { authClient } from '../lib/auth-client'; // Imported Better Auth client

const signUpSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: passwordSchema,
});

type SignUpData = z.infer<typeof signUpSchema>;

const SignUpCard = () => {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const handleSignUp = async (values: SignUpData) => {
    setLoading(true);
    setServerError(null);

    // Better Auth SignUp
    const { error } = await authClient.signUp.email({
      email: values.email,
      password: values.password,
      name: values.username, // Better Auth uses 'name' for the display name
    });

    if (error) {
      // Better Auth returns clear error messages in the error object
      setServerError(error.message || "Error during signup");
      setLoading(false);
      return;
    }

    // Success: Navigate to admin or show a "Check your email" message
    navigate("/admin");
  };

  return (
    <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Daftar Masuk</h2>
        <p className="text-gray-500 mt-2">Pentadbir Masjid Nurul Huda</p>
      </div>

      <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-6">
        {/* USERNAME */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nama Pengguna</label>
          <input
            type="text"
            placeholder="John Doe"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition"
            {...form.register("username")}
          />
          {form.formState.errors.username && (
            <p className="text-red-500 text-sm mt-2">{form.formState.errors.username.message}</p>
          )}
        </div>

        {/* EMAIL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">E-mel</label>
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
          
          {/* Container to allow absolute positioning of the eye icon */}
          <div className="relative w-full">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 pr-12"
              {...form.register("password")}
            />
            
            {/* Eye Toggle Button */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              )}
            </button>
          </div>

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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition duration-300 disabled:opacity-50"
        >
          {loading ? "Sila tunggu..." : "Daftar Akaun"}
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Sudah mempunyai akaun?
            <Link to="/login" className="ml-2 text-blue-600 hover:underline font-medium">
              Log Masuk
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default SignUpCard;