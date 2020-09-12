/* �O���[�o���ϐ� */
var lattice;
var canvaslist = new Array();
/* �ݒ�l */
//�w�i�F
var backcol = 0xafafaf;
//�i�q���x��
var param = {
    size: 1, height: 0, curveSegments: 3,
    font: "helvetiker", weight: "normal", style: "normal",
    bevelThickness: 1, bevelSize: 2, bevelEnabled: false
}

/* 3D�x�N�g���I�u�W�F�N�g */
var ArrowObj = function (dir, length, color) {
    /* �x�N�g�����f������ */
    this.cone = new THREE.Mesh();
    this.cylinder = new THREE.Mesh();

    /* �x�N�g�������E�����E�F�ݒ� */
    this.set(dir, length, color);
};

ArrowObj.prototype = {
    set: function (dir, length, color) {
        /* ����geometry, material������ */
        this.cone.geometry.dispose();
        this.cylinder.geometry.dispose();
        this.cone.material.dispose();
        this.cylinder.material.dispose();
        /* �x�N�g�����f���ݒ� */
        //�~�������̍���
        var cone_h = 1.5;
        var cylinder_h = length - cone_h;
        // ��ʔ��a,���ʔ��a,����,�~��������  
        this.cone.geometry = new THREE.CylinderGeometry(0, 0.3, cone_h, 50);
        this.cylinder.geometry = new THREE.CylinderGeometry(0.1, 0.1, cylinder_h, 50);

        this.cone.material = new THREE.MeshPhongMaterial({ color: color });
        this.cylinder.material = new THREE.MeshPhongMaterial({ color: color });
        /* �����ʒu */
        this.cone.position.set(0, 0, 0);
        this.cylinder.position.set(0, 0, 0);

        /* ��]���� */
        //�������� up (�K�i��)
        var up = new THREE.Vector3(0, 1, 0);
        //������������ dir (�K�i���ς�)
        //��]�� nor = up �~ dir
        var nor = new THREE.Vector3();
        nor.crossVectors(up, dir).normalize();
        //��]�p ��
        var dot = up.dot(dir);// / (up.length() * normalAxis.length());
        var rad = Math.acos(dot);
        //�N�H�[�^�j�I������
        var q = new THREE.Quaternion();
        q.setFromAxisAngle(nor, rad);
        //�K�p
        this.cone.rotation.setFromQuaternion(q);
        this.cylinder.rotation.setFromQuaternion(q);
        /* ���s�ړ� */
        this.cone.translateY(length - cone_h / 2);
        this.cylinder.translateY(cylinder_h / 2);
        //�����f���ւ̑���͉�����ǂݏグ�Ă����ƕ�����₷��
    }
};

/* ���C���I�u�W�F�N�g */
var LatticeArray = function (v1, v2, v3) {
    for (var i = 0; i < 4; i = i + 1) this[i] = new THREE.Line();
    //geometry�̐錾�Ɛ���
    var geometry = new Array(4);
    for (var i = 0; i < 4; i = i + 1) {
        geometry[i] = new THREE.Geometry();
    }
    var origin = new THREE.Vector3(0, 0, 0);
    //���_���W�̒ǉ�
    geometry[0].vertices.push(origin);
    geometry[0].vertices.push(v1);

    geometry[1].vertices.push(new THREE.Vector3().addVectors(origin, v2));
    geometry[1].vertices.push(new THREE.Vector3().addVectors(v1, v2));

    geometry[2].vertices.push(new THREE.Vector3().addVectors(origin, v3));
    geometry[2].vertices.push(new THREE.Vector3().addVectors(v1, v3));

    geometry[3].vertices.push(new THREE.Vector3().addVectors(origin, new THREE.Vector3().addVectors(v2, v3)));
    geometry[3].vertices.push(new THREE.Vector3().addVectors(v1, new THREE.Vector3().addVectors(v2, v3)));

    /* �o�^ */
    for (var i = 0; i < 4; i = i + 1) {
        this[i].geometry = geometry[i];
        this[i].material = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    }

};

LatticeArray.prototype = {
    set: function (v1, v2, v3) {
        var origin = new THREE.Vector3(0, 0, 0);
        //���_���W�̍Đݒ�
        this[0].geometry.vertices[0] = origin;
        this[0].geometry.vertices[1] = v1;

        this[1].geometry.vertices[0] = new THREE.Vector3().addVectors(origin, v2);
        this[1].geometry.vertices[1] = new THREE.Vector3().addVectors(v1, v2);

        this[2].geometry.vertices[0] = new THREE.Vector3().addVectors(origin, v3);
        this[2].geometry.vertices[1] = new THREE.Vector3().addVectors(v1, v3);

        this[3].geometry.vertices[0] = new THREE.Vector3().addVectors(origin, new THREE.Vector3().addVectors(v2, v3));
        this[3].geometry.vertices[1] = new THREE.Vector3().addVectors(v1, new THREE.Vector3().addVectors(v2, v3));
    }
};

/* �i�q�I�u�W�F�N�g */
var LatticeClass = function (a, b, c, alpha, beta, gamma) {
    /* �i�q�萔�ݒ� */
    this.a = a;
    this.b = b;
    this.c = c;
    this.alpha = alpha;
    this.beta = beta;
    this.gamma = gamma;

    /* ���i�q�x�N�g�� */
    this.real = new Object();
    this.real.A = new THREE.Vector3();
    this.real.B = new THREE.Vector3();
    this.real.C = new THREE.Vector3();
    this.calcRealAxes();
    this.createRealAxes();

    /* �t�i�q�x�N�g�� */
    this.recipro = new Object();
    this.recipro.A = new THREE.Vector3();
    this.recipro.B = new THREE.Vector3();
    this.recipro.C = new THREE.Vector3();
    this.calcReciproAxes();
    this.createReciproAxes();
};
LatticeClass.prototype = {
    calcRealAxes: function () {
        /* �x��radian */
        var alpha_rad = this.alpha / 180 * Math.PI;
        var beta_rad = this.beta / 180 * Math.PI;
        var gamma_rad = this.gamma / 180 * Math.PI;
        /* ���i�q�x�N�g���v�Z(a:x��, b:xy���ʓ�) */
        this.real.A.set(1, 0, 0).multiplyScalar(this.a);
        this.real.B.set(Math.cos(gamma_rad), Math.sin(gamma_rad), 0);
        this.real.B.multiplyScalar(this.b);
        var cx = Math.cos(beta_rad);
        var cy = (Math.cos(alpha_rad) - Math.cos(beta_rad) * Math.cos(gamma_rad)) / Math.sin(gamma_rad);
        var cz = Math.sqrt(1 - cx * cx - cy * cy);
        this.real.C.set(cx, cy, cz);
        this.real.C.multiplyScalar(this.c);
        this.real.Vol = this.real.A.dot(new THREE.Vector3().crossVectors(this.real.B, this.real.C));//�̐�
    },
    createRealAxes: function () {
        /* ���i�q���f������ */
        this.real.A.obj = new ArrowObj(new THREE.Vector3().copy(this.real.A).normalize(), this.real.A.length(), 0xff0000);
        this.real.B.obj = new ArrowObj(new THREE.Vector3().copy(this.real.B).normalize(), this.real.B.length(), 0x00ff00);
        this.real.C.obj = new ArrowObj(new THREE.Vector3().copy(this.real.C).normalize(), this.real.C.length(), 0x0000ff);

        this.real.A.line = new LatticeArray(this.real.A, this.real.B, this.real.C);
        this.real.B.line = new LatticeArray(this.real.B, this.real.C, this.real.A);
        this.real.C.line = new LatticeArray(this.real.C, this.real.A, this.real.B);

        /* ���x������ */
        this.real.A.label = new THREE.Mesh(new THREE.TextGeometry('a', param), new THREE.MeshLambertMaterial({ color: 0x000000 }));
        this.real.A.label.position.set(this.real.A.x, this.real.A.y, this.real.A.z);
        this.real.B.label = new THREE.Mesh(new THREE.TextGeometry('b', param), new THREE.MeshLambertMaterial({ color: 0x000000 }));
        this.real.B.label.position.set(this.real.B.x, this.real.B.y, this.real.B.z);
        this.real.C.label = new THREE.Mesh(new THREE.TextGeometry('c', param), new THREE.MeshLambertMaterial({ color: 0x000000 }));
        this.real.C.label.position.set(this.real.C.x, this.real.C.y, this.real.C.z);
        //��MeshLambertMaterial:�����̈ʒu�Ɉ˂炸�������邳�̍ގ�
    },
    setRealAxes: function () {
        /* ���i�q���f���ʒu */
        this.real.A.obj.set(new THREE.Vector3().copy(this.real.A).normalize(), this.real.A.length(), 0xff0000);
        this.real.B.obj.set(new THREE.Vector3().copy(this.real.B).normalize(), this.real.B.length(), 0x00ff00);
        this.real.C.obj.set(new THREE.Vector3().copy(this.real.C).normalize(), this.real.C.length(), 0x0000ff);

        this.real.A.line.set(this.real.A, this.real.B, this.real.C);
        this.real.B.line.set(this.real.B, this.real.C, this.real.A);
        this.real.C.line.set(this.real.C, this.real.A, this.real.B);

        /* ���x���ʒu */
        this.real.A.label.position.set(this.real.A.x, this.real.A.y, this.real.A.z);
        this.real.B.label.position.set(this.real.B.x, this.real.B.y, this.real.B.z);
        this.real.C.label.position.set(this.real.C.x, this.real.C.y, this.real.C.z);
    },
    calcReciproAxes: function () {
        /* �t�i�q�x�N�g���v�Z */
        var V = this.real.Vol;
        var scale = 100;//�X�P�[���l
        this.recipro.A.crossVectors(this.real.B, this.real.C).divideScalar(V);
        this.recipro.B.crossVectors(this.real.C, this.real.A).divideScalar(V);
        this.recipro.C.crossVectors(this.real.A, this.real.B).divideScalar(V);

        this.a_sta = this.recipro.A.length();
        this.b_sta = this.recipro.B.length();
        this.c_sta = this.recipro.C.length();

        this.recipro.A.multiplyScalar(scale);
        this.recipro.B.multiplyScalar(scale);
        this.recipro.C.multiplyScalar(scale);

    },
    createReciproAxes: function () {
        /* �t�i�q���f������ */
        this.recipro.A.obj = new ArrowObj(new THREE.Vector3().copy(this.recipro.A).normalize(), this.recipro.A.length(), 0xff0000);
        this.recipro.B.obj = new ArrowObj(new THREE.Vector3().copy(this.recipro.B).normalize(), this.recipro.B.length(), 0x00ff00);
        this.recipro.C.obj = new ArrowObj(new THREE.Vector3().copy(this.recipro.C).normalize(), this.recipro.C.length(), 0x0000ff);

        this.recipro.A.line = new LatticeArray(this.recipro.A, this.recipro.B, this.recipro.C);
        this.recipro.B.line = new LatticeArray(this.recipro.B, this.recipro.C, this.recipro.A);
        this.recipro.C.line = new LatticeArray(this.recipro.C, this.recipro.A, this.recipro.B);

        /* ���x������ */
        this.recipro.A.label = new THREE.Mesh(new THREE.TextGeometry('a*', param), new THREE.MeshLambertMaterial({ color: 0x000000 }));
        this.recipro.A.label.position.set(this.recipro.A.x, this.recipro.A.y, this.recipro.A.z);
        this.recipro.B.label = new THREE.Mesh(new THREE.TextGeometry('b*', param), new THREE.MeshLambertMaterial({ color: 0x000000 }));
        this.recipro.B.label.position.set(this.recipro.B.x, this.recipro.B.y, this.recipro.B.z);
        this.recipro.C.label = new THREE.Mesh(new THREE.TextGeometry('c*', param), new THREE.MeshLambertMaterial({ color: 0x000000 }));
        this.recipro.C.label.position.set(this.recipro.C.x, this.recipro.C.y, this.recipro.C.z);
    },
    setReciproAxes: function () {
        /* �t�i�q���f������ */
        this.recipro.A.obj.set(new THREE.Vector3().copy(this.recipro.A).normalize(), this.recipro.A.length(), 0xff0000);
        this.recipro.B.obj.set(new THREE.Vector3().copy(this.recipro.B).normalize(), this.recipro.B.length(), 0x00ff00);
        this.recipro.C.obj.set(new THREE.Vector3().copy(this.recipro.C).normalize(), this.recipro.C.length(), 0x0000ff);

        this.recipro.A.line.set(this.recipro.A, this.recipro.B, this.recipro.C);
        this.recipro.B.line.set(this.recipro.B, this.recipro.C, this.recipro.A);
        this.recipro.C.line.set(this.recipro.C, this.recipro.A, this.recipro.B);

        /* ���x������ */
        this.recipro.A.label.position.set(this.recipro.A.x, this.recipro.A.y, this.recipro.A.z);
        this.recipro.B.label.position.set(this.recipro.B.x, this.recipro.B.y, this.recipro.B.z);
        this.recipro.C.label.position.set(this.recipro.C.x, this.recipro.C.y, this.recipro.C.z);
    }
};



var init = function () {

    /* �J��������(���L�����o�X�ŋ���) */
    //�J�������ʂ��͈�(OrthographicCamera)
    var range = 15;
    var camera = new THREE.OrthographicCamera(-range, range, range, -range);//�����e
    camera.position.set(0, 0, 50);

    var canvasInit = function (id) {

        /* �L�����o�X���� */
        var canvas = document.getElementById(id);
        width = canvas.clientWidth;
        height = canvas.clientHeight;

        /* �����_���[���� */
        var renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setClearColor(backcol);
        canvas.appendChild(renderer.domElement);

        /* �V�[������ */
        var scene = new THREE.Scene();
        /* ���s�����ݒ� */
        var directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(camera.position.x, camera.position.y, camera.position.z).normalize();
        scene.add(directionalLight);

        return { renderer: renderer, scene: scene, directionalLight: directionalLight }

    };

    /* �L�����o�X������ */
    canvaslist.push(canvasInit("canvas01"));
    canvaslist.push(canvasInit("canvas02"));

    /* �J�����ݒ� */
    for (var i = 0; i < canvaslist.length; i = i + 1) {
        /* �J�������ʉ� */
        canvaslist[i].camera = camera;//���I�u�W�F�N�g�͎Q�Ɠn��
        /* �J��������(�g���b�N�{�[��)�ݒ� */
        canvaslist[i].controls = new THREE.TrackballControls(canvaslist[i].camera, canvaslist[i].renderer.domElement);//�X�N���[�����ł̂ݑ���ł���
        canvaslist[i].controls.rotateSpeed = 3.0; //��]������Ƃ��̑���
        canvaslist[i].controls.zoomSpeed = 1.2; //�Y�[������Ƃ��̑���
        canvaslist[i].controls.panSpeed = 0.3; //�p������Ƃ��̑���
        canvaslist[i].controls.noRotate = false; //true�ŉ�]�����s�ɂ���
        //canvaslist[i].controls.noZoom = false; //true�ŃY�[�������s�ɂ���
        canvaslist[i].controls.noZoom = true; //true�ŃY�[�������s�ɂ���
        canvaslist[i].controls.noPan = false; //true�Ńp���̑����s�ɂ���
        //canvaslist[i].controls.staticMoving = false;//��𗣂������~����
        canvaslist[i].controls.staticMoving = true;//��𗣂������~����
        canvaslist[i].controls.dynamicDampingFactor = 0.3;//��𗣂����Ƃ��̌����̑傫��(0�`1)
        canvaslist[i].controls.minDistance = 0; //�߂Â��鋗���̍ŏ��l
        canvaslist[i].controls.maxDistance = Infinity; //��������鋗���̍ő�l
        canvaslist[i].controls.keys = [65 /*A*/, 83 /*S*/, 68 /*D*/];//�L�[����(ASCII �A��]�E�Y�[���E�p���̏�)
    }
    /* �J�������������������ʉ� */
    canvaslist[0].controls.target = canvaslist[1].controls.target;

    /*  �i�q���� */
    var a = b = c = 10, alpha = beta = gamma = 90;
    lattice = new LatticeClass(a /*a*/, b /*b*/, c /*c*/, alpha /*alpha*/, beta /*beta*/, gamma /*gamma*/);

    //���i�q�x�N�g��
    canvaslist[0].scene.add(lattice.real.A.obj.cone);
    canvaslist[0].scene.add(lattice.real.A.obj.cylinder);
    canvaslist[0].scene.add(lattice.real.B.obj.cone);
    canvaslist[0].scene.add(lattice.real.B.obj.cylinder);
    canvaslist[0].scene.add(lattice.real.C.obj.cone);
    canvaslist[0].scene.add(lattice.real.C.obj.cylinder);
    canvaslist[0].scene.add(lattice.real.A.label);//�i�q���x��
    canvaslist[0].scene.add(lattice.real.B.label);
    canvaslist[0].scene.add(lattice.real.C.label);
    for (var i = 0; i < 4; i = i + 1) {
        canvaslist[0].scene.add(lattice.real.A.line[i]);
        canvaslist[0].scene.add(lattice.real.B.line[i]);
        canvaslist[0].scene.add(lattice.real.C.line[i]);
    }

    //�t�i�q�x�N�g��
    canvaslist[1].scene.add(lattice.recipro.A.obj.cone);
    canvaslist[1].scene.add(lattice.recipro.A.obj.cylinder);
    canvaslist[1].scene.add(lattice.recipro.B.obj.cone);
    canvaslist[1].scene.add(lattice.recipro.B.obj.cylinder);
    canvaslist[1].scene.add(lattice.recipro.C.obj.cone);
    canvaslist[1].scene.add(lattice.recipro.C.obj.cylinder);
    canvaslist[1].scene.add(lattice.recipro.A.label);//�i�q���x��
    canvaslist[1].scene.add(lattice.recipro.B.label);
    canvaslist[1].scene.add(lattice.recipro.C.label);
    for (var i = 0; i < 4; i = i + 1) {
        canvaslist[1].scene.add(lattice.recipro.A.line[i]);
        canvaslist[1].scene.add(lattice.recipro.B.line[i]);
        canvaslist[1].scene.add(lattice.recipro.C.line[i]);
    }

    /* �C�x���g�n���h���o�^ */
    var mousedown = false;
    for (var i = 0; i < canvaslist.length; i = i + 1) {
        canvaslist[i].renderer.domElement.addEventListener('mousedown', function (e) {
            if (e.button == 1) {//���{�^����������Ă���ꍇ
                mousedown = true;
                prevPosition = { x: e.pageX, y: e.pageY };
            }
        }, false);
    }

    var zoomSpeed = 0.01;
    document.addEventListener('mousemove', function (e) {
        if (!mousedown) return;
        moveDistance = { x: e.pageX - prevPosition.x, y: e.pageY - prevPosition.y };
        factor = 1.0 + moveDistance.y * zoomSpeed;
        /* �Y�[�� */
        camera.left *= factor;
        camera.right *= factor;
        camera.top *= factor;
        camera.bottom *= factor;
        camera.updateProjectionMatrix();
        prevPosition = { x: e.pageX, y: e.pageY };
    }, false);

    document.addEventListener('mouseup', function (e) {
        mousedown = false;
    }, false);
};

var renderLoop = function () {
    requestAnimationFrame(renderLoop);
    /* ���C���̒��_���X�V����悤�ɐݒ� */
    for (var j = 0; j < 4; j = j + 1) {
        lattice.real.A.line[j].geometry.verticesNeedUpdate = true;
        lattice.real.B.line[j].geometry.verticesNeedUpdate = true;
        lattice.real.C.line[j].geometry.verticesNeedUpdate = true;
        lattice.recipro.A.line[j].geometry.verticesNeedUpdate = true;
        lattice.recipro.B.line[j].geometry.verticesNeedUpdate = true;
        lattice.recipro.C.line[j].geometry.verticesNeedUpdate = true;
    }
    for (var i = 0; i < canvaslist.length; i = i + 1) {
        /* ���s��������ɃJ�����������ɂ��� */
        canvaslist[i].directionalLight.position.set(canvaslist[i].camera.position.x, canvaslist[i].camera.position.y, canvaslist[i].camera.position.z).normalize();
        /* ��������ɃJ���������������悤�ɂ��� */
        if (i == 0) {//���i�q
            lattice.real.A.label.rotation.setFromRotationMatrix(canvaslist[i].camera.matrix);
            lattice.real.B.label.rotation.setFromRotationMatrix(canvaslist[i].camera.matrix);
            lattice.real.C.label.rotation.setFromRotationMatrix(canvaslist[i].camera.matrix);
        }
        else if (i == 1) {//�t�i�q
            lattice.recipro.A.label.rotation.setFromRotationMatrix(canvaslist[i].camera.matrix);
            lattice.recipro.B.label.rotation.setFromRotationMatrix(canvaslist[i].camera.matrix);
            lattice.recipro.C.label.rotation.setFromRotationMatrix(canvaslist[i].camera.matrix);
        }

        /* �g���b�N�{�[������ */
        canvaslist[i].controls.update();

        /* �`�� */
        canvaslist[i].renderer.render(canvaslist[i].scene, canvaslist[i].camera);
    }


};


var main = function () {

    init();
    renderLoop();
};

window.addEventListener('DOMContentLoaded', main, false);