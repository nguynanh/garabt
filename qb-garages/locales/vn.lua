local Translations = {
    error = {
        no_vehicles = 'Không có phương tiện nào ở vị trí này!',
        not_depot = 'Xe của bạn không có trong kho',
        not_owned = 'Không thể cất giữ phương tiện này',
        not_correct_type = 'Bạn không thể cất giữ loại phương tiện này ở đây',
        not_enough = 'Không đủ tiền',
        no_garage = 'Không có',
        vehicle_occupied = 'Bạn không thể cất giữ phương tiện này vì nó không trống',
        vehicle_not_tracked = 'Không thể theo dõi phương tiện',
        no_spawn = 'Khu vực quá đông đúc'
    },
    success = {
        vehicle_parked = 'Đã cất giữ phương tiện',
        vehicle_tracked = 'Đã theo dõi phương tiện',
    },
    status = {
        out = 'Ngoài',
        garaged = 'Trong gara',
        impound = 'Bị cảnh sát tịch thu',
        house = 'Nhà',
    },
    info = {
        car_e = 'E - Gara',
        sea_e = 'E - Nhà thuyền',
        air_e = 'E - Nhà chứa máy bay',
        rig_e = 'E - Lô giàn khoan',
        depot_e = 'E - Kho',
        house_garage = 'E - Gara nhà',
    }
}

if GetConvar('qb_locale', 'en') == 'vi' then
    Lang = Locale:new({
        phrases = Translations,
        warnOnMissing = true,
        fallbackLang = Lang,
    })
end