const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const LandingPageView = sequelize.define("LandingPageView", {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    ip_address: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    user_agent: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    page_url: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    tableName: "landing_page_views",
    timestamps: true
});

module.exports = LandingPageView;
