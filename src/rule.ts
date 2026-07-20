const rules = {

    patient: {
        view: [
            {
                relation: "doctor"
            },
            {
                relation: "admitted_in",
                permission: "view"
            }
        ]
    },

    ward: {
        view: [
            {
                relation: "assigned_nurse"
            }
        ]
    }

}