local QBCore = exports['qb-core']:GetCoreObject()

-- Functions

local function generateOID()
    local num = math.random(1, 10) .. math.random(111, 999)
    return 'OC' .. num
end

-- Callbacks

QBCore.Functions.CreateCallback('qb-occasions:server:getVehicles', function(_, cb)
    local result = MySQL.query.await('SELECT * FROM occasion_vehicles', {})
    local vehiclesWithSellerInfo = {}
    if result[1] then
        for _, vehicleData in ipairs(result) do
            -- Lấy thông tin người bán từ bảng players dựa trên citizenid (seller)
            local sellerInfo = MySQL.query.await('SELECT charinfo FROM players WHERE citizenid = ?', { vehicleData.seller })
            if sellerInfo and sellerInfo[1] then
                local charinfo = json.decode(sellerInfo[1].charinfo)
                vehicleData.sellerName = charinfo.firstname .. ' ' .. charinfo.lastname
                vehicleData.sellerPhone = charinfo.phone
            else
                -- Nếu không tìm thấy thông tin người bán, đặt mặc định
                vehicleData.sellerName = 'Người bán không rõ'
                vehicleData.sellerPhone = 'N/A'
            end
            table.insert(vehiclesWithSellerInfo, vehicleData)
        end
        cb(vehiclesWithSellerInfo) -- Trả về danh sách xe đã có thông tin người bán
    else
        cb(nil)
    end
end)

QBCore.Functions.CreateCallback('qb-occasions:server:checkVehicleOwner', function(source, cb, plate)
    local pData = QBCore.Functions.GetPlayer(source)
    MySQL.query('SELECT balance FROM player_vehicles WHERE plate = ? AND citizenid = ?', { plate, pData.PlayerData.citizenid }, function(result)
        if result[1] then
            cb(true, result[1].balance)
        else
            cb(false)
        end
    end)
end)

QBCore.Functions.CreateCallback('qb-occasions:server:getSellerInformation', function(_, cb, citizenid)
    MySQL.query('SELECT * FROM players WHERE citizenid = ?', { citizenid }, function(result)
        if result[1] then
            cb(result[1])
        else
            cb(nil)
        end
    end)
end)

QBCore.Functions.CreateCallback('qb-vehiclesales:server:CheckModelName', function(_, cb, plate)
    if plate then
        local ReturnData = MySQL.scalar.await('SELECT vehicle FROM player_vehicles WHERE plate = ?', { plate })
        if ReturnData then
            cb(ReturnData:lower())
        else
            cb(nil)
        end
    end
end)

-- Events

RegisterNetEvent('qb-occasions:server:ReturnVehicle', function(vehicleData)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    local result = MySQL.query.await('SELECT * FROM occasion_vehicles WHERE plate = ? AND occasionid = ?', { vehicleData['plate'], vehicleData['oid'] })
    if result[1] then
        if result[1].seller == Player.PlayerData.citizenid then
            MySQL.insert('INSERT INTO player_vehicles (license, citizenid, vehicle, hash, mods, plate, state) VALUES (?, ?, ?, ?, ?, ?, ?)', { Player.PlayerData.license, Player.PlayerData.citizenid, vehicleData['model'], joaat(vehicleData['model']), vehicleData['mods'], vehicleData['plate'], 0 })
            MySQL.query('DELETE FROM occasion_vehicles WHERE occasionid = ? AND plate = ?', { vehicleData['oid'], vehicleData['plate'] })
            TriggerClientEvent('qb-occasions:client:ReturnOwnedVehicle', src, result[1])
            TriggerClientEvent('qb-occasion:client:refreshVehicles', -1)
        else
            TriggerClientEvent('QBCore:Notify', src, Lang:t('error.not_your_vehicle'), 'error', 3500)
        end
    else
        TriggerClientEvent('QBCore:Notify', src, Lang:t('error.vehicle_does_not_exist'), 'error', 3500)
    end
end)

RegisterNetEvent('qb-occasions:server:sellVehicle', function(vehiclePrice, vehicleData)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    MySQL.query('DELETE FROM player_vehicles WHERE plate = ? AND vehicle = ?', { vehicleData.plate, vehicleData.model })
    MySQL.insert('INSERT INTO occasion_vehicles (seller, price, description, plate, model, mods, occasionid) VALUES (?, ?, ?, ?, ?, ?, ?)', { Player.PlayerData.citizenid, vehiclePrice, vehicleData.desc, vehicleData.plate, vehicleData.model:lower(), json.encode(vehicleData.mods), generateOID() })
    TriggerEvent('qb-log:server:CreateLog', 'vehicleshop', 'Vehicle for Sale', 'red', '**' .. GetPlayerName(src) .. '** has a ' .. vehicleData.model .. ' priced at ' .. vehiclePrice)
    TriggerClientEvent('qb-occasion:client:refreshVehicles', -1)
end)

RegisterNetEvent('qb-occasions:server:sellVehicleBack', function(vehData)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    local price = 0
    local plate = vehData.plate
    for _, v in pairs(QBCore.Shared.Vehicles) do
        if v['hash'] == vehData.model then
            price = tonumber(v['price'])
            break
        end
    end
    local payout = math.floor(tonumber(price * 0.5))
    Player.Functions.AddMoney('bank', payout, 'sold vehicle back')
    TriggerClientEvent('QBCore:Notify', src, Lang:t('success.sold_car_for_price', { value = payout }), 'success', 5500)
    MySQL.query('DELETE FROM player_vehicles WHERE plate = ?', { plate })
end)

RegisterNetEvent('qb-occasions:server:buyVehicle', function(vehicleData)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    local result = MySQL.query.await('SELECT * FROM occasion_vehicles WHERE plate = ? AND occasionid = ?', { vehicleData['plate'], vehicleData['oid'] })
    if result[1] and next(result[1]) then
        if Player.PlayerData.money.bank >= result[1].price then
            local SellerCitizenId = result[1].seller
            local SellerData = QBCore.Functions.GetPlayerByCitizenId(SellerCitizenId)
            local NewPrice = math.ceil((result[1].price / 100) * 77)
            Player.Functions.RemoveMoney('bank', result[1].price, 'bought vehicle used lot')
            MySQL.insert(
                'INSERT INTO player_vehicles (license, citizenid, vehicle, hash, mods, plate, state) VALUES (?, ?, ?, ?, ?, ?, ?)', {
                    Player.PlayerData.license,
                    Player.PlayerData.citizenid, result[1]['model'],
                    GetHashKey(result[1]['model']),
                    result[1]['mods'],
                    result[1]['plate'],
                    0
                })
            if SellerData then
                SellerData.Functions.AddMoney('bank', NewPrice, 'sold vehicle used lot')
            else
                local BuyerData = MySQL.query.await('SELECT * FROM players WHERE citizenid = ?', { SellerCitizenId })
                if BuyerData[1] then
                    local BuyerMoney = json.decode(BuyerData[1].money)
                    BuyerMoney.bank = BuyerMoney.bank + NewPrice
                    MySQL.update('UPDATE players SET money = ? WHERE citizenid = ?', { json.encode(BuyerMoney), SellerCitizenId })
                end
            end
            TriggerEvent('qb-log:server:CreateLog', 'vehicleshop', 'bought', 'green', '**' .. GetPlayerName(src) .. '** has bought for ' .. result[1].price .. ' (' .. result[1].plate .. ') from **' .. SellerCitizenId .. '**')
            TriggerClientEvent('qb-occasions:client:BuyFinished', src, result[1])
            TriggerClientEvent('qb-occasion:client:refreshVehicles', -1)
            MySQL.query('DELETE FROM occasion_vehicles WHERE plate = ? AND occasionid = ?', { result[1].plate, result[1].occasionid })
            exports['qb-phone']:sendNewMailToOffline(SellerCitizenId, {
                sender = Lang:t('mail.sender'),
                subject = Lang:t('mail.subject'),
                message = Lang:t('mail.message', { value = NewPrice, value2 = QBCore.Shared.Vehicles[result[1].model].name })
            })
        else
            TriggerClientEvent('QBCore:Notify', src, Lang:t('error.not_enough_money'), 'error', 3500)
        end
    end
end)

-- CALLBACK ĐÃ CẬP NHẬT: Dùng logic "mặc định là Cars"
QBCore.Functions.CreateCallback('qb-vehiclesales:server:getSpotAvailability', function(source, cb, zoneName)
    local vehiclesOnSale = MySQL.query.await('SELECT model FROM occasion_vehicles', {})
    local spotConfig = Config.Zones[zoneName].VehicleSpotTypes
    local availability = {}
    local counts = {}

    for spotType, _ in pairs(spotConfig) do
        counts[spotType] = 0
        availability[spotType] = #spotConfig[spotType].Spots
    end

    if vehiclesOnSale then
        for _, vehicle in ipairs(vehiclesOnSale) do
            local vehicleModel = vehicle.model:lower()
            -- Kiểm tra danh sách đặc biệt trước, nếu không có thì mặc định là "Cars"
            local spotType = Config.SpecialVehicleTypes[vehicleModel] or 'Cars'
            if counts[spotType] ~= nil then
                counts[spotType] = counts[spotType] + 1
            end
        end
    end

    for spotType, _ in pairs(spotConfig) do
        availability[spotType] = #spotConfig[spotType].Spots - counts[spotType]
    end

    cb(availability)
end)