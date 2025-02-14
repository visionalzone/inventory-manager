import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

const AuthWrapper = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) navigate('/login');
    };
    checkAuth();
  }, []);

  return children;
};

// 在路由配置中使用
<Route path="/admin" element={
  <AuthWrapper>
    <AdminPage />
  </AuthWrapper>
} />