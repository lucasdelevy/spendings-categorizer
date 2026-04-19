import GoogleSignIn from "../auth/GoogleSignIn";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Spendings Categorizer
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Faça login para salvar e visualizar seus extratos
          </p>
        </div>
        <GoogleSignIn />
      </div>
    </div>
  );
}
