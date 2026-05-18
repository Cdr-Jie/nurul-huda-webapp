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
        <h2 className="text-3xl font-bold text-gray-900">Sign Up</h2>
        <p className="text-gray-500 mt-2">Pentadbir Masjid Nurul Huda</p>
      </div>

      <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-6">
        {/* USERNAME */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition duration-300 disabled:opacity-50"
        >
          {loading ? "Sila tunggu..." : "Daftar Akaun"}
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?
            <Link to="/login" className="ml-2 text-blue-600 hover:underline font-medium">
              Login
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default SignUpCard;