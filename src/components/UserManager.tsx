import React, { useState } from 'react';
import { useTravelStore } from '../store';

// 预定义颜色选项
const COLORS = [
  '#1E40AF', // 蓝色
  '#10B981', // 绿色
  '#F59E0B', // 橙色
  '#EF4444', // 红色
  '#8B5CF6', // 紫色
  '#EC4899', // 粉色
  '#06B6D4', // 青色
  '#84CC16', // 浅绿色
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
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">用户管理</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-md font-medium mb-2">当前用户</h3>
          <select
            value={currentUser?.id || ''}
            onChange={(e) => switchUser(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {users.map(user => (
              <option key={user.id} value={user.id}>
                <span className="inline-block w-3 h-3 mr-2" style={{ backgroundColor: user.color }}></span>
                {user.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <h3 className="text-md font-medium mb-2">添加新用户</h3>
          <div className="space-y-2">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="请输入用户名"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择颜色
              </label>
              <div className="flex space-x-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setUserColor(color)}
                    className={`w-6 h-6 rounded-full transition-transform ${userColor === color ? 'scale-110 ring-2 ring-blue-500' : 'hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                    aria-label={`选择颜色 ${color}`}
                  />
                ))}
              </div>
            </div>
            
            <button
              onClick={handleAddUser}
              disabled={!userName.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              添加用户
            </button>
          </div>
        </div>
        
        {users.length > 0 && (
          <div>
            <h3 className="text-md font-medium mb-2">用户列表</h3>
            <ul className="space-y-2">
              {users.map(user => (
                <li key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <span className="inline-block w-4 h-4 mr-2 rounded-full" style={{ backgroundColor: user.color }}></span>
                    <span>{user.name}</span>
                    {currentUser?.id === user.id && (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">当前</span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteUser(user.id)}
                    disabled={users.length <= 1}
                    className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    删除
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