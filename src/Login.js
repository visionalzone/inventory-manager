import { useState } from 'react';
import { supabase } from './supabaseClient';

const Login = () => {
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (!error) setMagicLinkSent(true);
  };

  return (
    <div>
      {magicLinkSent ? (
        <p>登录链接已发送至邮箱，请查收！</p>
      ) : (
        <form onSubmit={handleLogin}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="工作邮箱"
          />
          <button type="submit">获取登录链接</button>
        </form>
      )}
    </div>
  );
};