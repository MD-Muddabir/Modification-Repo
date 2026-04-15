const { Institute, Plan } = require('./backend/models');

async function fix() {
    try {
        const institutes = await Institute.findAll({ include: [Plan] });
        for (let inst of institutes) {
            if (inst.Plan && inst.status === 'active') {
                await inst.update({
                    current_feature_assignment: inst.Plan.feature_assignment,
                    current_feature_transport: inst.Plan.feature_transport,
                    current_feature_public_page: inst.Plan.feature_public_page,
                    current_feature_mobile_app: inst.Plan.feature_mobile_app,
                });
                console.log(`Updated institute ${inst.id} to match its Plan`);
            }
        }
        console.log("Done");
    } catch (e) {
        console.error(e);
    }
}
fix();
