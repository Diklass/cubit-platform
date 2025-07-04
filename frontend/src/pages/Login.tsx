// src/pages/Login.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SpinnerIcon } from '../components/SpinnerIcon';

const schema = z.object({
  email: z.string().email({ message: 'Неверный формат email' }),
  password: z.string().min(6, { message: 'Минимум 6 символов' }),
});
type FormData = z.infer<typeof schema>;

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch {
      // обработка ошибки (уже есть в контексте)
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Вход в Cubit</h2>
      <form onSubmit={handleSubmit(onSubmit)} aria-busy={isSubmitting} noValidate>
        <div>
          <label htmlFor="email">Email</label><br />
          <input
            id="email"
            type="email"
            {...register('email')}
            aria-invalid={!!errors.email}
            aria-describedby="emailError"
            className="focus-visible:ring-2 focus-visible:ring-blue-500 p-2 border rounded"
          />
          {errors.email && (
            <p id="emailError" role="alert" className="text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password">Пароль</label><br />
          <input
            id="password"
            type="password"
            {...register('password')}
            aria-invalid={!!errors.password}
            aria-describedby="passwordError"
            className="focus-visible:ring-2 focus-visible:ring-blue-500 p-2 border rounded"
          />
          {errors.password && (
            <p id="passwordError" role="alert" className="text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 flex items-center justify-center bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isSubmitting ? <SpinnerIcon /> : 'Войти'}
        </button>
      </form>
    </div>
  );
};

export default Login;
