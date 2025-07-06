local QBCore = exports['qb-core']:GetCoreObject()

RegisterServerEvent("customplates:buyPlate", function(newPlate, oldPlate)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    local citizenid = Player.PlayerData.citizenid
    local cost = 1000

    if not newPlate or #newPlate < 5 or #newPlate > 8 or not newPlate:match("^[A-Z0-9]+$") then
        TriggerClientEvent("QBCore:Notify", src, "Biển số không hợp lệ.", "error")
        return
    end

    local exists = MySQL.scalar.await("SELECT 1 FROM player_vehicles WHERE plate = ?", { newPlate })
    if exists then
        TriggerClientEvent("QBCore:Notify", src, "Biển số này đã được sử dụng.", "error")
        return
    end

    local result = MySQL.single.await("SELECT * FROM player_vehicles WHERE plate = ?", { oldPlate })
    if not result or result.citizenid ~= citizenid then
        TriggerClientEvent("QBCore:Notify", src, "Chiếc xe này không phải của bạn.", "error")
        return
    end

    if not Player.Functions.RemoveMoney("bank", cost, "plaka-degisim") then
        TriggerClientEvent("QBCore:Notify", src, "Bạn không có đủ tiền.", "error")
        return
    end

    MySQL.update.await("UPDATE player_vehicles SET plate = ? WHERE plate = ?", {
        newPlate, oldPlate
    })

    TriggerClientEvent("QBCore:Notify", src, "Biển số đã được thay đổi thành công!", "success")
    TriggerClientEvent("customplates:updateVehiclePlate", src, newPlate)
    TriggerClientEvent('vehiclekeys:client:SetOwner', src, newPlate)
    TriggerClientEvent("customplates:closeUI", src)
end)
