

export function CutSignOfVietNamese(str: string) {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
    str = str.replace(/đ/g, 'd');
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
    str = str.replace(/Đ/g, 'D');
    return str;
}

export function normalizePhoneNumber(phoneNumber: string) {
    if (phoneNumber) {
        phoneNumber = phoneNumber.trim();
        phoneNumber = phoneNumber.replace(/\s+/g, '');
    }

    return phoneNumber;
}


export function getLastName(str: string): string {
    if (!str) {
        return ""
    }
    const words = str.trim().split(' ');
    return words[words.length - 1];
}

// Define the structure of the function to check if the order qualifies for shipping
export function isOrderQualifyForShipping(orderUnitCode: string, deliveryAreaPolicy: any[]): boolean {
    // Split the order's administrative unit code by commas
    const orderUnits = orderUnitCode.split(',').map(code => code.trim());

    // Iterate through the delivery area policy to check if the order matches any entry
    for (const policy of deliveryAreaPolicy) {
        // Case 2: If the policy only specifies the country, the order qualifies for shipping
        if (policy.country_code && !policy.province_gso_id && !policy.district_gso_id && !policy.ward_gso_id) {
            if (orderUnits.includes(policy.country_code.toString())) {
                return true;
            }
        }

        // Case 1: If the policy specifies only country and province
        else if (policy.country_code && policy.province_gso_id && !policy.district_gso_id && !policy.ward_gso_id) {
            const policyUnits = [
                policy.province_gso_id,
                policy.country_code.toString()
            ];
            const filteredPolicyUnits = policyUnits.filter(Boolean);

            // Check if the order matches country and province
            const isMatch = filteredPolicyUnits.every((unit, index) => {
                const orderIndex = orderUnits.length - filteredPolicyUnits.length + index;
                return unit === orderUnits[orderIndex];
            });

            if (isMatch) {
                return true;
            }
        }

        // Regular case: Policy specifies ward, district, province, and country
        else {
            const policyUnits = [
                policy.ward_gso_id,
                policy.district_gso_id,
                policy.province_gso_id,
                policy.country_code.toString()
            ];

            // Filter out undefined values (e.g., if the policy is for district, it won't have a ward ID)
            const filteredPolicyUnits = policyUnits.filter(Boolean);

            // Check if the order matches ward, district, province, and country
            const isMatch = filteredPolicyUnits.every((unit, index) => {
                const orderIndex = orderUnits.length - filteredPolicyUnits.length + index;
                return unit === orderUnits[orderIndex];
            });

            if (isMatch) {
                return true;
            }
        }
    }

    // If no match is found, the order does not qualify for shipping
    return false;
}
