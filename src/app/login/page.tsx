import { LoginForm } from "@/components/layout/LoginForm";

export default function LoginPage() {
  return (
    <main className="admin-light-scope flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-10">
      <section className="w-full max-w-[520px] rounded-[28px] bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.18)] sm:p-10">
        <h1 className="font-sora text-[32px] font-extrabold tracking-[-0.02em] text-[#081B4B] sm:text-[36px]">
          Iniciar sesión
        </h1>
        <p className="mt-2 text-[15px] font-medium text-[#4B5A7D]">Accede a tu cuenta de Mundo Celular</p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
