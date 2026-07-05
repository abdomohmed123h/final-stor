import { useState } from "react";
import toast from "react-hot-toast";
import { DEMO_CREDENTIALS } from "../../constants/initialData";
import { Btn, Input } from "../ui";

export function Login({ users, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    const user = users.find(
      (u) => u.username === username && u.password === password
    );
    if (user) {
      toast.success(`مرحباً بك، ${user.username}`);
      onLogin(user);
    } else {
      toast.error("اسم المستخدم أو كلمة المرور غير صحيحة");
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-800 flex items-center justify-center font-sans"
      style={{ fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif" }}
    >
      <div className="bg-white rounded-[20px] p-9 w-[340px] shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
        <div className="text-center mb-6">
          <div className="text-4xl">🏗️</div>
          <div className="text-xl font-bold text-slate-800 mt-2">
            البنا للمواد الإنشائية
          </div>
          <div className="text-[13px] text-slate-400 mt-1">تسجيل الدخول</div>
        </div>

        <Input
          label="اسم المستخدم"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="أدخل اسم المستخدم"
        />
        <Input
          label="كلمة المرور"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="أدخل كلمة المرور"
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        <Btn color="blue" onClick={handleLogin}>
          دخول
        </Btn>

        <div className="mt-4 p-3 bg-slate-50 rounded-lg text-[11px] text-gray-500">
          <div className="font-semibold mb-1">بيانات الدخول:</div>
          {DEMO_CREDENTIALS.map(([user, pass, roleLabel]) => (
            <div key={user}>
              {roleLabel}: <b>{user}</b> / {pass}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
