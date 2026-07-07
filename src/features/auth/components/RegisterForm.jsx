import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  CircularProgress,
} from '@mui/material';
import * as authService from '../../../api/authService';
import { useAuth } from '../../../hooks/useAuth';
import { getErrorMessage } from '../../../utils/errorUtils';

export default function RegisterForm() {
  const [serverError, setServerError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { name: '', email: '', password: '', confirmPassword: '' } });

  const password = watch('password');

  const onSubmit = async ({ name, email, password }) => {
    setServerError(null);
    try {
      const { accessToken } = await authService.register({ name, email, password });
      login(accessToken);
      navigate('/topics');
    } catch (error) {
      setServerError(
        error?.response?.status === 409
          ? 'An account with that email already exists.'
          : getErrorMessage(error)
      );
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      <Typography variant="h4" align="center" gutterBottom>
        Study Buddy
      </Typography>

      <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mt: -1 }}>
        Create your account
      </Typography>

      {serverError && (
        <Alert severity="error" role="alert">
          {serverError}
        </Alert>
      )}

      <TextField
        label="Name"
        type="text"
        fullWidth
        autoComplete="name"
        autoFocus
        error={!!errors.name}
        helperText={errors.name?.message}
        {...register('name', {
          required: 'Name is required',
          maxLength: { value: 100, message: 'Name must be 100 characters or fewer' },
        })}
      />

      <TextField
        label="Email"
        type="email"
        fullWidth
        autoComplete="email"
        error={!!errors.email}
        helperText={errors.email?.message}
        {...register('email', {
          required: 'Email is required',
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Please enter a valid email address',
          },
        })}
      />

      <TextField
        label="Password"
        type="password"
        fullWidth
        autoComplete="new-password"
        error={!!errors.password}
        helperText={errors.password?.message}
        {...register('password', {
          required: 'Password is required',
          minLength: { value: 6, message: 'Password must be at least 6 characters' },
        })}
      />

      <TextField
        label="Confirm Password"
        type="password"
        fullWidth
        autoComplete="new-password"
        error={!!errors.confirmPassword}
        helperText={errors.confirmPassword?.message}
        {...register('confirmPassword', {
          required: 'Please confirm your password',
          validate: (value) => value === password || 'Passwords do not match',
        })}
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={isSubmitting}
        sx={{ mt: 1 }}
      >
        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
      </Button>

      <Typography variant="body2" align="center">
        Already have an account?{' '}
        <Link component={RouterLink} to="/login">
          Log in
        </Link>
      </Typography>
    </Box>
  );
}
