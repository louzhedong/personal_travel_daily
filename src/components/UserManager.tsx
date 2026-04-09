import React, { useState } from 'react';
import { useTravelStore } from '../store';

// 预定义颜色选项
const COLORS = [
  '#10B981', // 绿色
  '#3B82F6', // 蓝色
  '#F59E0B', // 橙色
  '#EC4899', // 粉色
  '#8B5CF6', // 紫色
  '#06B6D4', // 青色
  '#84CC16', // 浅绿色
  '#EF4444', // 红色
];

const UserManager: React.FC = () => {
  const { users, currentUser, addUser, switchUser, deleteUser } = useTravelStore();
  
  const [userName, setUserName] = useState('');
  const [userColor, setUserColor] = useState(COLORS[0]);

  const handleAddUser = async () => {
    if (!userName.trim()) return;
    
    await addUser({
      name: userName.trim(),
      color: userColor,
    });
    
    // 重置表单
    setUserName('');
    setUserColor(COLORS[0]);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-purple-700 flex items-center gap-2">
        <span>👥</span> 用户管理
      </h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-md font-medium text-purple-700 mb-2">当前用户</h3>
          <select
            value={currentUser?.id || ''}
            onChange={(e) => switchUser(e.target.value)}
            className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
          >
            {users.map(user => (
              <option key={user.id} value={user.id}>
                <span className="inline-block w-3 h-3 mr-2" style={{ backgroundColor: user.color }}></span>
                {user.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="p-4 bg-purple-50 rounded-xl">
          <h3 className="text-md font-medium text-purple-700 mb-3">添加新用户</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="请输入用户名"
              className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
            />
            
            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                选择颜色
              </label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setUserColor(color)}
                    className={`w-8 h-8 rounded-full transition-transform ${userColor === color ? 'scale-110 ring-2 ring-purple-400' : 'hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                    aria-label={`选择颜色 ${color}`}
                  />
                ))}
              </div>
            </div>
            
            <button
              onClick={handleAddUser}
              disabled={!userName.trim()}
              className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:bg-purple-300 disabled:cursor-not-allowed"
            >
              添加用户
            </button>
          </div>
        </div>
        
        {users.length > 0 && (
          <div>
            <h3 className="text-md font-medium text-purple-700 mb-2">用户列表</h3>
            <ul className="space-y-2">
              {users.map(user => (
                <li key={user.id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <span className="inline-block w-5 h-5 mr-2 rounded-full" style={{ backgroundColor: user.color }}></span>
                    <span className="text-gray-800">{user.name}</span>
                    {currentUser?.id === user.id && (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">当前</span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteUser(user.id)}
                    disabled={users.length <= 1}
                    className="text-red-500 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManager;