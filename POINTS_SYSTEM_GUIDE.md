# 积分记录和存储系统使用指南

## 概述

本系统实现了完整的积分记录和存储功能，包括积分初始化、积分累积规则、历史记录查询等功能。

## 云函数说明

### 1. updatePoints 云函数

用于更新用户积分，支持多种积分类型。

#### 功能特性

- **积分初始化**：每个用户首次交互时自动初始化为 0 积分
- **积分累积规则**：
  - 投稿活动：+50 积分
  - 组队成功：+20 积分
  - 每日登录：+5 积分
  - 发圈宣传：+50 积分
- **防重复机制**：每日登录积分限制为每天一次
- **原子操作**：使用数据库事务确保数据一致性
- **完整日志**：记录所有积分变更的时间戳和操作类型

#### 调用方式

```javascript
wx.cloud.callFunction({
  name: 'updatePoints',
  data: {
    pointsType: 'submit_activity', // 积分类型
    userId: 'optional_user_id' // 可选，不传则使用当前登录用户的 openid
  },
  success: (res) => {
    if (res.result.success) {
      console.log('积分更新成功:', res.result.data)
      // res.result.data 包含：
      // - userId: 用户ID
      // - pointsChange: 积分变更值
      // - totalPoints: 更新后的总积分
      // - operationType: 操作类型
      // - operationName: 操作名称
      // - timestamp: 时间戳
      // - isNewUser: 是否为新用户
    } else {
      console.error('积分更新失败:', res.result.message)
    }
  },
  fail: (err) => {
    console.error('调用云函数失败:', err)
  }
})
```

#### 积分类型

- `submit_activity`：投稿活动
- `team_up_success`：组队成功
- `daily_login`：每日登录
- `share_to_circle`：发圈宣传

#### 返回值

**成功时**：
```javascript
{
  success: true,
  message: '积分更新成功',
  data: {
    userId: 'user_openid',
    pointsChange: 50,
    totalPoints: 50,
    operationType: 'submit_activity',
    operationName: '投稿活动',
    timestamp: '2026-03-27T10:00:00.000Z',
    isNewUser: true
  }
}
```

**失败时**：
```javascript
{
  success: false,
  errorCode: 'ALREADY_LOGGED_IN_TODAY',
  message: '今日已登录，无法重复获取积分',
  totalPoints: 100
}
```

#### 错误码

- `INVALID_PARAMS`：缺少必要参数
- `INVALID_POINTS_TYPE`：无效的积分类型
- `USER_NOT_LOGGED_IN`：用户未登录
- `ALREADY_LOGGED_IN_TODAY`：今日已登录，无法重复获取积分
- `DATABASE_ERROR`：数据库错误
- `NETWORK_ERROR`：网络错误
- `UNKNOWN_ERROR`：未知错误

### 2. exchangeGift 云函数

用于礼品兑换，扣减用户积分并记录兑换历史。

#### 功能特性

- **积分扣减**：根据礼品所需积分自动扣减用户积分
- **积分验证**：兑换前检查用户积分是否足够
- **历史记录**：自动记录兑换操作到积分历史
- **数据一致性**：确保积分扣减和历史记录的原子性

#### 调用方式

```javascript
wx.cloud.callFunction({
  name: 'exchangeGift',
  data: {
    giftId: 'gift_001',           // 礼品ID
    giftName: '清华文创笔记本',    // 礼品名称
    pointsCost: 100               // 所需积分
  },
  success: (res) => {
    if (res.result.success) {
      console.log('兑换成功:', res.result.data)
      // res.result.data 包含：
      // - userId: 用户ID
      // - giftId: 礼品ID
      // - giftName: 礼品名称
      // - pointsCost: 消耗积分
      // - totalPoints: 兑换后的总积分
      // - timestamp: 兑换时间
    } else {
      console.error('兑换失败:', res.result.message)
    }
  },
  fail: (err) => {
    console.error('调用云函数失败:', err)
  }
})
```

#### 返回值

**成功时**：
```javascript
{
  success: true,
  message: '兑换成功',
  data: {
    userId: 'user_openid',
    giftId: 'gift_001',
    giftName: '清华文创笔记本',
    pointsCost: 100,
    totalPoints: 185,
    timestamp: '2026-03-28T10:00:00.000Z'
  }
}
```

**失败时**：
```javascript
{
  success: false,
  errorCode: 'INSUFFICIENT_POINTS',
  message: '积分不足',
  currentPoints: 50,
  requiredPoints: 100
}
```

#### 错误码

- `INVALID_PARAMS`：缺少必要参数
- `INVALID_POINTS_COST`：积分消耗必须大于0
- `USER_NOT_LOGGED_IN`：用户未登录
- `INSUFFICIENT_POINTS`：积分不足
- `DATABASE_ERROR`：数据库错误
- `NETWORK_ERROR`：网络错误
- `UNKNOWN_ERROR`：未知错误

### 2. getPointsHistory 云函数

用于查询用户的积分历史记录。

#### 调用方式

```javascript
wx.cloud.callFunction({
  name: 'getPointsHistory',
  data: {},
  success: (res) => {
    if (res.result.success) {
      console.log('查询积分历史成功:', res.result.data)
      // res.result.data 包含：
      // - userId: 用户ID
      // - totalPoints: 当前总积分
      // - lastLoginDate: 最后登录日期
      // - history: 积分历史记录数组
    } else {
      console.error('查询积分历史失败:', res.result.message)
    }
  },
  fail: (err) => {
    console.error('调用云函数失败:', err)
  }
})
```

#### 返回值

```javascript
{
  success: true,
  message: '查询积分历史成功',
  data: {
    userId: 'user_openid',
    totalPoints: 150,
    lastLoginDate: '2026-03-27',
    history: [
      {
        id: 'history_id',
        pointsChange: 50,
        operationType: 'submit_activity',
        operationName: '投稿活动',
        timestamp: '2026-03-27T10:00:00.000Z',
        notes: '积分变更',
        totalPointsAfter: 50
      }
    ]
  }
}
```

## 数据库集合配置

### 1. user_points 集合

存储用户的积分信息。

**字段说明**：
- `_id`：用户 openid（主键）
- `total_points`：总积分
- `last_login_date`：最后登录日期
- `create_time`：创建时间
- `update_time`：更新时间

**权限设置**：
```json
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
}
```

### 2. points_history 集合

存储用户的积分变更历史。

**字段说明**：
- `_id`：历史记录 ID（主键）
- `user_id`：用户 openid
- `points_change`：积分变更值
- `operation_type`：操作类型
- `operation_name`：操作名称
- `timestamp`：时间戳
- `notes`：备注
- `total_points_after`：变更后的总积分

**权限设置**：
```json
{
  "read": "doc.user_id == auth.openid",
  "write": false
}
```

## 部署步骤

1. **创建数据库集合**：
   - 在云开发控制台中创建 `user_points` 和 `points_history` 集合
   - 按照上述说明设置权限规则

2. **部署云函数**：
   - 在微信开发者工具中，右键点击 `cloudfunctions/updatePoints` 目录
   - 选择「上传并部署」
   - 等待部署完成
   - 同样方式部署 `cloudfunctions/getPointsHistory` 云函数

3. **测试功能**：
   - 调用 `updatePoints` 云函数测试积分更新功能
   - 调用 `getPointsHistory` 云函数测试历史记录查询功能

## 使用示例

### 在投稿活动后添加积分

```javascript
// 在 publish-activity.js 的 submitActivity 方法中
wx.cloud.callFunction({
  name: 'updatePoints',
  data: {
    pointsType: 'submit_activity'
  },
  success: (res) => {
    if (res.result.success) {
      console.log('投稿活动成功，获得', res.result.data.pointsChange, '积分')
      // 更新本地积分显示
      this.updateLocalPoints(res.result.data.totalPoints)
    }
  }
})
```

### 在每日登录时添加积分

```javascript
// 在 mine.js 的 checkIn 方法中
wx.cloud.callFunction({
  name: 'updatePoints',
  data: {
    pointsType: 'daily_login'
  },
  success: (res) => {
    if (res.result.success) {
      console.log('每日登录成功，获得', res.result.data.pointsChange, '积分')
      wx.showToast({
        title: '登录成功，+5积分',
        icon: 'success'
      })
    } else if (res.result.errorCode === 'ALREADY_LOGGED_IN_TODAY') {
      wx.showToast({
        title: '今日已登录',
        icon: 'none'
      })
    }
  }
})
```

### 查询积分历史

```javascript
// 在 points-record 页面中
wx.cloud.callFunction({
  name: 'getPointsHistory',
  success: (res) => {
    if (res.result.success) {
      this.setData({
        totalPoints: res.result.data.totalPoints,
        historyList: res.result.data.history
      })
    }
  }
})
```

## 注意事项

1. **并发控制**：系统使用数据库事务确保积分更新的原子性，防止并发问题
2. **重复登录**：每日登录积分限制为每天一次，防止重复获取
3. **错误处理**：所有操作都有完善的错误处理机制，确保系统稳定性
4. **日志记录**：所有积分变更都有详细的历史记录，便于审计和追溯
5. **权限控制**：数据库集合设置了严格的权限规则，确保用户只能操作自己的数据