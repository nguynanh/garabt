const modNames = {
    "0": "Cánh gió", "1": "Cản trước", "2": "Cản sau", "3": "Hông xe", "4": "Ống xả", "5": "Khung", "6": "Lưới tản nhiệt", "7": "Nắp ca-pô", "8": "Chắn bùn", "9": "Chắn bùn phải", "10": "Mui xe",
    "11": "Động cơ", "12": "Phanh", "13": "Hộp số", "14": "Còi", "15": "Hệ thống treo", "16": "Giáp",
    "18": "Turbo", "22": "Đèn Xenon", "23": "Mâm xe", "25": "Sơn nóc", "27": "Màu khói lốp", "28": "Màu gầm", "38": "Màu nội thất", "46": "Màu sơn",
    "48": "Họa tiết"
};
const moddedVehicleList = [
    // "cheburek", // ví dụ
    // "italirsx", // ví dụ
];
// -- [KẾT THÚC KHAI BÁO] --

// Thêm danh sách các modId mà bạn muốn hiển thị
// Các ID này phải khớp với các key số trong modNames
const modsToDisplay = [
    "11", 
    "16", 
    "18", 
    "13", 
    "12", 
    "15", 
];

// Ánh xạ các tên khóa từ database sang modId số
const modKeyToIdMap = {
    "modSpoilers": "0",
    "modFrontBumper": "1",
    "modRearBumper": "2",
    "modSideSkirt": "3",
    "modExhaust": "4",
    "modFrame": "5",
    "modGrille": "6",
    "modHood": "7",
    "modFender": "8",
    "modRightFender": "9",
    "modRoof": "10", // Có thể cần phân biệt rõ hơn nếu có "Sơn nóc" riêng
    "modEngine": "11",
    "modBrakes": "12",
    "modTransmission": "13",
    "modHorns": "14",
    "modSuspension": "15",
    "modArmor": "16",
    "modTurbo": "18",
    "modXenon": "22",
    "wheels": "23", // Ánh xạ tới Mâm xe
    "tyreSmokeColor": "27", // Màu khói lốp
    "neonColor": "28", // Màu gầm
    "interiorColor": "38", // Màu nội thất
    "color1": "46", // Màu sơn chính
    "color2": "46", // Màu sơn phụ
    "pearlescentColor": "46", // Màu ánh kim
    "modLivery": "48", // Họa tiết
    // Thêm các ánh xạ khác nếu cần
};


// Hàm tìm kiếm xe khi người dùng gõ vào ô tìm kiếm
$("#garage-search-input").on("keyup", function() {
    var value = $(this).val().toLowerCase();
    $(".garage-vehicle-list .garage-card").filter(function() {
      $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
    });
});

/**
 * Hàm chính để thiết lập và hiển thị danh sách xe trong gara
 * @param {Array} Vehicles - Dữ liệu tất cả các xe của người chơi
 */
SetupGarageVehicles = function(Vehicles) {
    $(".garage-vehicle-list").html(""); // Luôn xóa danh sách cũ trước khi tạo mới

    if (Vehicles && Vehicles.length > 0) {
        Vehicles.sort((a, b) => a.fullname.localeCompare(b.fullname));

        $.each(Vehicles, function(i, vehicle) {

            // --- LOGIC LẤY ẢNH ---
            let vehicleImageHTML;
            const model = vehicle.model.toLowerCase();

            if (moddedVehicleList.includes(model)) {
                vehicleImageHTML = `<img src="./images/${model}.png" onerror="this.onerror=null; this.src='./img/default.png';">`;
            } else {
                // Sử dụng đường dẫn trực tiếp và thêm thẻ <img> để xử lý lỗi tải ảnh
                let imageUrl = `https://docs.fivem.net/vehicles/${model}.webp`;
                vehicleImageHTML = `<img src="${imageUrl}" onerror="this.onerror=null; this.src='./img/default.png';">`;
            }

            // Lấy và định dạng dữ liệu xe
            const fuelLevel = vehicle.fuel !== undefined ? `${Math.ceil(vehicle.fuel)}%` : 'N/A';
            const engineHealth = vehicle.engine !== undefined ? `${Math.ceil(vehicle.engine / 10)}%` : 'N/A';
            const bodyHealth = vehicle.body !== undefined ? `${Math.ceil(vehicle.body / 10)}%` : 'N/A';
            const garageLocation = vehicle.garage ? `In ${vehicle.garage}` : 'N/A';

            // DÒNG SỬA LỖI ĐÚNG - PHẢI NẰM BÊN TRONG VÒNG LẶP NÀY
            const statusClass = vehicle.state ? 'status-in' : 'status-out';

            // Tạo thẻ HTML mới với class trạng thái đã được thêm vào
            const element = `
                <div class="garage-card ${statusClass}" data-plate="${vehicle.plate}">
                    <div class="garage-card-image">
                        ${vehicleImageHTML}
                    </div>
                    <div class="garage-card-details">
                        <div class="vehicle-name">${vehicle.fullname}</div>
                        <div class="vehicle-info">
                            Fuel: ${fuelLevel}<br>
                            Engine: ${engineHealth} | Body: ${bodyHealth}<br>
                            Garage: ${garageLocation}
                        </div>
                    </div>
                </div>
            `;

            $(".garage-vehicle-list").append(element);
            $(`[data-plate="${vehicle.plate}"]`).data('VehicleData', vehicle);
        });
    } else {
        $(".garage-vehicle-list").html("<p style='color: #8f8f8f; text-align: center; margin-top: 5vh;'>You have no vehicles.</p>");
    }
}

// NEW: Xử lý sự kiện khi bấm vào một thẻ xe
$(document).on('click', '.garage-card', function(e){
    e.preventDefault();
    const vehicleData = $(this).data('VehicleData');

    if (vehicleData) {
        // Lấy URL hình ảnh
        let vehicleImageURL;
        const model = vehicleData.model.toLowerCase();
        if (moddedVehicleList.includes(model)) {
            vehicleImageURL = `./images/${model}.png`;
        } else {
            vehicleImageURL = `https://docs.fivem.net/vehicles/${model}.webp`;
        }

        // Xử lý thông tin cơ bản
        let vehicleState = 'N/A';
        if (vehicleData.state === 1) { vehicleState = 'Trong Gara'; }
        else if (vehicleData.state === 0) { vehicleState = 'Bên ngoài'; }
        else if (vehicleData.state === 2) { vehicleState = 'Trong kho tạm giữ'; }

        let drivingDistance = 'N/A';
        if (vehicleData.drivingdistance && vehicleData.drivingdistance > 0) {
            drivingDistance = `${Math.round(vehicleData.drivingdistance / 1000)} km`;
        } else if (vehicleData.drivingdistance === 0) {
            drivingDistance = '0 km';
        }

        // Điền thông tin cơ bản vào HTML
        $('#detail-vehicle-name').text(vehicleData.fullname);
        $('#detail-vehicle-image').attr('src', vehicleImageURL).on('error', function() { $(this).attr('src', './img/default.png'); });
        $('#detail-vehicle-plate').text(vehicleData.plate);
        $('#detail-vehicle-fuel').text(vehicleData.fuel !== undefined ? `${Math.ceil(vehicleData.fuel)}%` : 'N/A');
        $('#detail-vehicle-engine').text(vehicleData.engine !== undefined ? `${Math.ceil(vehicleData.engine / 10)}%` : 'N/A');
        $('#detail-vehicle-body').text(vehicleData.body !== undefined ? `${Math.ceil(vehicleData.body / 10)}%` : 'N/A');
        $('#detail-vehicle-garage').text(vehicleData.garage || 'N/A');
        $('#detail-vehicle-state').text(vehicleState);
        $('#detail-vehicle-distance').text(drivingDistance);

        // ---- LOGIC MỚI: HIỂN THỊ CHI TIẾT ĐỒ ĐỘ ----
        const modsListContainer = $('#detail-vehicle-mods-list');
        modsListContainer.empty(); // Xóa danh sách cũ trước khi thêm mới

        let hasRelevantMods = false; // Biến cờ để kiểm tra xem có mod nào được hiển thị không

        if (vehicleData.mods && typeof vehicleData.mods === 'object' && Object.keys(vehicleData.mods).length > 0) {
            for (const key in vehicleData.mods) { // 'key' sẽ là "modEngine", "modArmor", v.v.
                const modId = modKeyToIdMap[key]; // Lấy ID số từ khóa chuỗi

                // Chỉ xử lý nếu có ánh xạ và modId nằm trong danh sách muốn hiển thị
                if (modId && modsToDisplay.includes(modId)) {
                    const modValue = vehicleData.mods[key]; // Giá trị thực tế của mod (cấp độ hoặc boolean)
                    const modName = modNames[modId] || `Đồ độ #${modId}`; // Sử dụng ID số để lấy tên
                    let modText = '';

                    if (modId === "18" || modId === "22") { // Turbo và Xenon (on/off)
                        if (modValue === 1 || modValue === true) {
                            modText = `${modName}: <span class="mod-value">Đã lắp</span>`;
                        } else {
                            continue; // Không hiển thị nếu không lắp hoặc giá trị -1
                        }
                    } else if (["27", "28", "38", "46"].includes(modId)) { // Các mod màu sắc đặc biệt
                        if (Array.isArray(modValue)) { // Mảng RGB cho màu khói lốp, màu gầm
                             modText = `${modName}: <span class="mod-value">RGB(${modValue[0]}, ${modValue[1]}, ${modValue[2]})</span>`;
                        } else if (modValue >= 0) { // Chỉ số màu
                            modText = `${modName}: <span class="mod-value">Đã thiết lập (ID: ${modValue})</span>`;
                        } else {
                            continue; // Không hiển thị nếu -1 hoặc không cài đặt
                        }
                    } else if (modValue >= 0) { // Các mod dựa trên cấp độ
                        modText = `${modName}: <span class="mod-value">Cấp ${modValue + 1}</span>`;
                    } else {
                        // Không hiển thị các mod có giá trị -1 (không lắp/mặc định) trừ khi được chỉ định
                        continue;
                    }

                    if (modText) {
                        modsListContainer.append(`<div class="mod-item">${modText}</div>`);
                        hasRelevantMods = true; // Đánh dấu là có mod được hiển thị
                    }
                }
            }
        }

        // Nếu không có mod nào phù hợp được tìm thấy hoặc hiển thị
        if (!hasRelevantMods) {
            modsListContainer.append(`<div class="mod-item-none">Không có đồ độ được hỗ trợ hiển thị</div>`);
        }

        // Hiển thị màn hình chi tiết
        $('#garage-vehicle-detail-view').css('display', 'flex').hide().fadeIn(200);
        $('.garage-app-header, .garage-search, .garage-vehicle-list').fadeOut(200);
    }
});

// NEW: Xử lý sự kiện khi bấm nút quay lại
$(document).on('click', '#garage-detail-back-button', function(e){
    e.preventDefault();
    $('#garage-vehicle-detail-view').fadeOut(200, function(){
        $(this).css('display', 'none');
    });
    $('.garage-app-header, .garage-search, .garage-vehicle-list').fadeIn(200);
});
